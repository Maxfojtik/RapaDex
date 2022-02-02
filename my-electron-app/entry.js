const { app, BrowserWindow, ipcMain} = require('electron');
const { spawn } = require('child_process');
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
var win;

var configPath = "K:/BF/PRSM/TechHub/RepaDex/configuration.json";
//var configPath = "C:/Users/Maxwell/Documents/GitHub/RapaDex/configuration.json";
var configPathLocalFolder = process.env.APPDATA+"/repadex/";
var configPathLocal = configPathLocalFolder+"configuration.json";
var backendPath = "";//JSON.parse(configTxt).backendPath;
var lockedPath = "";//JSON.parse(configTxt).lockFilePath;

var saving = false;
var goodToSave = false;
var doneSaving = true;
const id = crypto.randomBytes(16).toString("hex");

var repairJSON;
var savingTimer;
var loadingTimer;

function lockFile()
{
	fs.access(lockedPath, fs.F_OK, (err) => {
		//console.log("try");
		if (err) {
			try {
				fs.closeSync(fs.openSync(lockedPath, 'w'));//create it
			} catch (e) {
				win.webContents.send("fromMainDisconnected", "");
				setTimeout(lockFile, 2000);//try again in 2
				console.log(e);
				return;
			}
		}
		win.webContents.send("fromMainConnected", "");
		//file exists now
		if(saving)
		{
			fs.readFile(lockedPath, 'utf8' , (err, txt) => {
				if (err) {
					setTimeout(lockFile, 5000);//try again in 5
					console.error(err);
					return;
				}
				if(txt!="")
				{
					if(id!=txt)
					{
						win.webContents.send("fromMainWaiting", "");
						console.log("waiting on lock");
						goodToSave = false;
						setTimeout(lockFile, 2000);
						return;
					}
					else
					{
						goodToSave = true;
						if(doneSaving)
						{
							fs.writeFile(lockedPath, "", err => {	//unlock it to us
								if (err) {
									setTimeout(lockFile, 2000);//try again in 2
									console.error(err);
									return;
								}
								doneSaving = false;
								saving = false;
								console.log("unlocked");
								setTimeout(lockFile, 1000);
								if(closeAfterSave)
								{
									win.close();
								}
								return;
							});
						}
						else
						{
							setTimeout(lockFile, 1000);
							return;
						}
					}
				}
				else										//if the file is empty...
				{
					fs.writeFile(lockedPath, id, err => {	//lock it to us
						if (err) {
							setTimeout(lockFile, 5000);//try again in 5
							console.error(err);
							return;
						}
						console.log("locked");
						setTimeout(lockFile, 100);
						return;
					});
				}
			});
		}
		else
		{
			setTimeout(lockFile, 100);
			return;
		}
	});
}
function makeDescriptors(repair)
{
	var descriptors = [];
	if(repair["phone"])
	{
		descriptors.push(repair["phone"].toLowerCase());
	}
	descriptors.push(repair["email"].toLowerCase());
	descriptors.push(repair["serial"].toLowerCase());
	descriptors.push(repair["name"].toLowerCase());
	descriptors.push((repair["refNum"]+"").toLowerCase());//convert to string
	if(repair["iPadSN"])
	{
		descriptors.push(repair["iPadSN"].toLowerCase());
	}
	return descriptors;
}
function saveRepairPart()
{
	//console.log("check");
	if(goodToSave)
	{
		clearInterval(savingTimer);
		try
		{
			var txt = fs.readFileSync(backendPath, 'utf8');
			//console.log(repairJSON);
			var jsonData = JSON.parse(txt);
			var jsonRepair = JSON.parse(repairJSON);
			jsonRepair["descriptors"] = makeDescriptors(jsonRepair);//just easier to do it "backend"
			if(!jsonData["repairs"])
			{
				jsonData["repairs"] = {};
			}
			jsonData["repairs"][jsonRepair.refNum] = jsonRepair;
			var stringified = JSON.stringify(jsonData);
			fs.writeFileSync(backendPath, stringified);
			doneSaving = true;
			win.webContents.send("fromMainSaveSuc", stringified);
		}
		catch(err)
		{
			//savingTimer = setInterval(saveRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			win.webContents.send("fromMainSaveFail", "");
		}
	}
}
function saveRepair(inJSON)
{
	console.log("saving repair");
	saving = true;
	doneSaving = false;
	repairJSON = inJSON;
	savingTimer = setInterval(saveRepairPart, 1000);
}

var loadMessageName;
function loadRepairPart()
{
	//console.log("check");
	if(goodToSave)
	{
		clearInterval(loadingTimer);
		try
		{
			var txt = fs.readFileSync(backendPath, 'utf8');
			//console.log(repairJSON);
			//repairJSONIn = JSON.parse(txt);
			doneSaving = true;
			win.webContents.send(loadMessageName, txt);
		}
		catch(err)
		{
			//loadingTimer = setInterval(loadRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			win.webContents.send("fromMainSaveFail", "");
		}
	}
}
function loadRepairs()
{
	console.log("loading repairs");
	saving = true;
	doneSaving = false;
	loadingTimer = setInterval(loadRepairPart, 1000);
}

function incRefPart()
{
	//console.log("check");
	if(goodToSave)
	{
		clearInterval(loadingTimer);
		try
		{
			var txt = fs.readFileSync(backendPath, 'utf8');
			//console.log(repairJSON);
			var jsonData = JSON.parse(txt);
			var refNum;
			if(jsonData.nextRefNumber)
			{
				refNum = jsonData.nextRefNumber;
			}
			else
			{
				refNum = 1;
			}
			jsonData.nextRefNumber = refNum+1;
			fs.writeFileSync(backendPath, JSON.stringify(jsonData));
			doneSaving = true;
			win.webContents.send("fromMainRefNum", refNum);
		}
		catch(err)
		{
			//loadingTimer = setInterval(loadRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			win.webContents.send("fromMainRefNumFail", "");
		}
	}
}
var closeAfterSave = false;
function incRefNum()
{
	console.log("inc ref num");
	saving = true;
	doneSaving = false;
	loadingTimer = setInterval(incRefPart, 1000);
}
app.whenReady().then(() => {
	fs.copyFile(configPath, configPathLocal, (err) => {
		if (err){ throw err};
		console.log('File was copied to destination');
		var txt = fs.readFileSync(configPathLocal, 'utf8');
		backendPath = JSON.parse(txt).backendPath;
		lockedPath = JSON.parse(txt).lockFilePath;
		startup();
	});
});
function checkAndSendRemoteVersion()
{
	fs.readFile(versionFile, 'utf8' , (err, txt) => {
		if(err)
		{
			console.log("version read error: "+err);
		}
		else
		{
			win.webContents.send("fromMainRemoteVersion", txt);
		}
	});	
}
ipcMain.on("toMain", (event, args) => 
{
	if(!doneSaving && saving)
	{
		console.log("ignoring "+args+" because we are already loading something...");
		return;
	}
	if(args=="configPls")
	{
		var txt = fs.readFileSync(configPathLocal, 'utf8');
		win.webContents.send("fromMainConfig", txt);
	}
	else if(args=="loadAll")
	{
		loadMessageName = "fromMainLoadAll";
		loadRepairs();
		//var txt = fs.readFileSync(backendPath, 'utf8');
		//jsonData = JSON.parse(txt);
	}
	else if(args=="updateRepairs")
	{
		loadMessageName = "fromMainUpdateRepairs";
		loadRepairs();
	}
	else if(args=="incRefNum")
	{
		incRefNum();
	}
	else if(args=="checkVersion")
	{
		checkAndSendRemoteVersion();
	}
	else if(args.substr(0,1)=="s")
	{
		saveRepair(args.substr(1));
	}
});
function createWindow () 
{
	win = new BrowserWindow(
	{
		minWidth: 1220,
		width: 1600, 
		height: 900, 
		autoHideMenuBar: true,
		icon: __dirname + '/RepaDexFin.ico',
		webPreferences: {
			nodeIntegration: false, // is default value after Electron v5
			contextIsolation: true, // protect against prototype pollution
			enableRemoteModule: false, // turn off remote
			preload: path.join(__dirname, "preload.js") // use a preload script
		}
	});
	win.on('close', (e) => {
		if(saving)
		{
			closeAfterSave = true;
			e.preventDefault();
		}
	});
	win.loadFile('index.html');
}
function restartMyself()
{
	const subprocess = spawn(configPathLocalFolder+"electron.exe", [''], {
		detached: true,
		stdio: 'ignore'
	});
	subprocess.unref();
	win.close();
}
function startup()
{
	createWindow();
	setTimeout(lockFile, 1000);//start the lockfile routine after copying
}