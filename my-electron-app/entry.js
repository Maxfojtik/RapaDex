const { app, BrowserWindow, ipcMain, Menu, MenuItem} = require('electron');
const { spawn } = require('child_process');
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
var win;

var remotePath = "K:/BF/PRSM/TechHub/RepaDex";
// var remotePath = "C:/Users/Maxwell/github/Rapadex";
var configPath = remotePath+"/configuration.json";
var configPathLocalFolder = (process.env.APPDATA || process.env.HOME)+"/repadex/";
var configPathLocal = configPathLocalFolder+"configuration.json";
var backendPath = "";//JSON.parse(configTxt).backendPath;
var lockedPath = "";//JSON.parse(configTxt).lockFilePath;
var versionFile = "";

var saving = false;
var goodToSave = false;
var doneSaving = true;
const id = crypto.randomBytes(16).toString("hex");

var repairJSON;
var savingTimer;
var loadingTimer;



function sendBack(key, val)
{
	try {
		win.webContents.send(key, val);
	} catch (e) {
		console.log(e);
	}
}

function lockFile()
{
	fs.access(lockedPath, fs.F_OK, (err) => {
		//console.log("try");
		if (err) {
			try {
				fs.closeSync(fs.openSync(lockedPath, 'w'));//create it
			} catch (e) {
				sendBack("fromMainDisconnected", "");
				setTimeout(lockFile, 2000);//try again in 2
				console.log(e);
				return;
			}
		}
		sendBack("fromMainConnected", "");
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
						sendBack("fromMainWaiting", "");
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
			sendBack("fromMainSaveSuc", stringified);
		}
		catch(err)
		{
			//savingTimer = setInterval(saveRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			sendBack("fromMainSaveFail", "");
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
			sendBack(loadMessageName, txt);
		}
		catch(err)
		{
			//loadingTimer = setInterval(loadRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			sendBack("fromMainSaveFail", "");
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
			sendBack("fromMainRefNum", refNum);
		}
		catch(err)
		{
			//loadingTimer = setInterval(loadRepairPart, 2000);
			console.log(err);
			doneSaving = true;
			sendBack("fromMainRefNumFail", "");
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
var errorWin;
function displayError(errorText)
{
	if(!errorWin)
	{
		errorWin = new BrowserWindow(
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
			}
		});
		errorWin.loadFile("error.html");
	}
	setTimeout(copyConfigAndStart, 1000);
}
function cancelError()
{
	if(errorWin)
	{
		errorWin.close();
	}
}
function copyConfigAndStart()
{
	fs.copyFile(configPath, configPathLocal, (err) => {
		if (err){ displayError(); return;}//throw err};
		cancelError();
		// console.log('File was copied to destination');
		var txt = fs.readFileSync(configPathLocal, 'utf8');
		backendPath = JSON.parse(txt).backendPath;
		lockedPath = JSON.parse(txt).lockFilePath;
		versionFile = JSON.parse(txt).versionFilePath;
		startup();
	});
}
app.whenReady().then(() => {
	copyConfigAndStart();
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
			sendBack("fromMainRemoteVersion", txt);
		}
	});
}
ipcMain.on("toMain", (event, args) =>
{
	if(args=="checkVersion")
	{
		checkAndSendRemoteVersion();
	}
	else
	{
		if(!doneSaving && saving)
		{
			console.log("ignoring "+args+" because we are already loading something...");
			return;
		}
		if(args=="configPls")
		{
			var txt = fs.readFileSync(configPathLocal, 'utf8');
			sendBack("fromMainConfig", txt);
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
		else if(args=="update")
		{
			update();
		}
		else if(args.substr(0,1)=="s")
		{
			saveRepair(args.substr(1));
		}
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
	win.webContents.on('context-menu', (event, params) => {
		//console.log(params);
	  const menu = new Menu();

	  // Add each spelling suggestion
	  for (const suggestion of params.dictionarySuggestions) {
	    menu.append(new MenuItem({
	      label: suggestion,
	      click: () => win.webContents.replaceMisspelling(suggestion)
	    }));
	  }

	  // Allow users to add the misspelled word to the dictionary
	  /*if (params.misspelledWord) {
	    menu.append(
	      new MenuItem({
	        label: 'Add to dictionary',
	        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
	      })
	    )
	  }*/

	  menu.popup();
	});
	if(fs.existsSync("C:/IAmiPad"))
	{
		win.loadFile('iPads.html');
	}
	else
	{
		win.loadFile('index.html');
	}
}
var totalFilesToDelete = 0;
var filesDeleted = 0;
function deleteMyself()
{
	console.log("deleteMyself");
	var directory = configPathLocalFolder+"/resources/app";
	fs.readdir(directory, (err, files) => {
		if (err) throw err;
		totalFilesToDelete = files.length;
		filesDeleted = 0;
		for (const file of files) {
			fs.unlink(path.join(directory, file), err => {
				if (err) throw err;
				filesDeleted++;
				sendBack("fromMainUpdateProgress", ((filesDeleted/totalFilesToDelete)/2*100)+"");
				if(filesDeleted==totalFilesToDelete)
				{
					copyANewVersion();
				}
			});
		}
	});
}
function copyANewVersion()
{
	console.log("copyANewVersion");
	var directoryRemote = remotePath+"/repadex/resources/app";
	var directoryLocal = configPathLocalFolder+"/resources/app";
	fs.readdir(directoryRemote, (err, files) => {
		if (err) throw err;
		totalFilesToCopy = files.length;
		filesCopied = 0;
		for (const file of files) {
			fs.copyFile(path.join(directoryRemote, file), path.join(directoryLocal, file), err => {
				if (err) throw err;
				filesCopied++;
				sendBack("fromMainUpdateProgress", ((filesCopied/totalFilesToCopy)/2*100+50)+"");
				if(filesCopied==totalFilesToCopy)
				{
					restartMyself();
				}
			});
		}
	});
}
function update()
{
	deleteMyself();
}
function restartMyself()
{
	console.log("restartMyself");
	const subprocess = spawn(configPathLocalFolder+"electron.exe", [''], {
		detached: true,
		stdio: 'ignore'
	});
	subprocess.unref();
	win.close();
}
function startup()
{
	fs.watch(backendPath, function (event, filename) {
		if(event=="change")
		{
			sendBack("fromMainLoadfile", "");
		}
		// console.log('event is: ' + event);
		// if (filename) {
		// 	console.log('filename provided: ' + filename);
		// } else {
		// 	console.log('filename not provided');
		// }
	});
	createWindow();
	setTimeout(lockFile, 1000);//start the lockfile routine after copying
}
