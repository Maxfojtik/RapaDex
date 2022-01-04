var refNumIn;
var addedWorkRefNum = 0;
var addWorkToast;
var loginToast;
var deleteClicksLeft;
var dontOverrideWarranty = false;
var dontOverrideProblem = false;
$(document).on("keyup", '#assetTagForm', function(e) {
	if (e.keyCode == 13 && !repairEditFrozen) {
		var value = $("#assetTagForm").val();
		console.log(value);
	}
});
$( document ).ready(function() {
	$('#addWorkToast').on('hidden.bs.toast', function () {
		addWorkToast.dispose();
	});
	$('#loginToast').on('hidden.bs.toast', function () {
		if(loginToast)
		{
			loginToast.dispose();
		}
	});
});
function findOtherRepairs()
{
	var mySerial = currentRepairJSON["serial"];
	var otherRelatedSerialRefs = [];
	for(var refNum in backendData["repairs"])
	{
		var otherSerial = backendData["repairs"][refNum]["serial"];
		if(otherSerial==mySerial)
		{
			otherRelatedSerialRefs.push(refNum);
		}
	}
	return otherRelatedSerialRefs;
	//console.log(otherRelatedSerialRefs);
}
var repairEditFrozen;
function freezeForm()
{
	repairEditFrozen = true;
	$("#repairEditBackButton").prop('disabled', true);
	$(".editWorkButtons").prop('disabled', true);
	$("#repairContextButtons").fadeOut();
	$(".not-active").css("cursor", "default");
}
function unfreezeForm()
{
	repairEditFrozen = false;
	$("#repairEditBackButton").prop('disabled', false);
	$(".editWorkButtons").prop('disabled', false);
	$("#repairContextButtons").fadeIn();
	$(".not-active").css("cursor", "pointer");
}
function showRelatedRepairs(refNum)
{
	$("#repairNav").children(".nav-repair-item").remove();//remove anything that was there
	var otherRepairs = findOtherRepairs();
	for(var i in otherRepairs)
	{
		var date = new Date(backendData["repairs"][otherRepairs[i]]["startDate"]);
		var dateText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
		var htmlAppend;
		if(otherRepairs[i]==refNum)
		{
			htmlAppend = "<li class='nav-item nav-repair-item'><a class='nav-link nav-repair-item-link active'>"+dateText+"</a></li>";
		}
		else
		{
			htmlAppend = "<li class='nav-item nav-repair-item'><a class='nav-link nav-repair-item-link not-active' onclick='showOtherRepair("+otherRepairs[i]+")'>"+dateText+"</a></li>";
		}
		//console.log(htmlAppend);
		$("#repairBackButtonItem").after(htmlAppend);
	}
}
function showOtherRepair(otherRefNum)
{
	if(!repairEditFrozen)
	{
		showRepair(backendData["repairs"], otherRefNum);//show the repair and start a new request for data (for updated info)
		//startUpdate(otherRefNum);
	}
}
function deleteWork()
{
	var popover = bootstrap.Popover.getInstance($('#deleteWorkButton'));
	popover.dispose();
	if(deleteClicksLeft==0)
	{
		addWorkToast.hide();
		var logEntry = JSON.parse("{}");
		logEntry["who"] = loggedInAs;
		logEntry["when"] = new Date().toJSON();
		logEntry["what"] = "deleted work entry "+editingIndex+": "+currentRepairJSON["workCompleted"][editingIndex]["what"];
		currentRepairJSON["workCompleted"].splice(editingIndex, 1);
		currentRepairJSON["logs"].push(logEntry);
		//console.log(JSON.stringify(currentRepairJSON["workCompleted"]));
		figureOutColorAndStatus();
		freezeForm();
		startLoadingSaving("Deleting record...");
		addedWorkRefNum = refNumIn;
		window.api.send("toMain", "s"+JSON.stringify(currentRepairJSON));
	}
	else
	{
		$('#deleteWorkButton').attr("data-bs-content", "Click "+deleteClicksLeft+" more time"+(deleteClicksLeft==1 ? "" : "s")+" to delete.");
		var popover = new bootstrap.Popover($("#deleteWorkButton"));
		popover.show();
		deleteClicksLeft--;
	}
}
function closeSaveAsPopover()
{
	var popover = bootstrap.Popover.getInstance($('#saveWorkAsButton'));
	if(popover)
	{
		popover.hide();
	}
}
function startUpdate(refNum)
{
	refNumIn = refNum;
	window.api.send("toMain", "updateRepairs");
	startLoadingSaving("Looking for updated information...");
	freezeForm();
}
window.api.receive("fromMainUpdateRepairs", (data) => 
{
	doneLoadingSaving();
	backendData = JSON.parse(data);
	showRepair(backendData["repairs"], refNumIn);
});
var loggedInAs = "";
var editingIndex = -1;
function editPencil(index)
{
	if(loggedInAs=="")
	{
		showLoginToast();
	}
	else
	{
		$("#addWorkTitle").text("Edit Work");
		var date = new Date(currentRepairJSON["workCompleted"][index]["when"]);
		date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
		$("#addWorkDate").val(date.toISOString().slice(0,16));
		$("#noteTextInput").val(currentRepairJSON["workCompleted"][index]["note"]);
		$("#addWorkSelector").val(currentRepairJSON["workCompleted"][index]["what"]);
		editingIndex = index;
		addWorkToast = new bootstrap.Toast($('#addWorkToast'));
		addWorkToast.show();
		var popover = new bootstrap.Popover($("#deleteWorkButton"));
		deleteClicksLeft = 5;
		$("#deleteButtonCol").show();
	}
}
var currentRepairJSON;
function selectRepairPill(name)
{
	saveWorkAs(name);
}
function saveWorkAs(name)
{
	var date = $("#addWorkDate").val();
	var repairWork = JSON.parse("{}");
	repairWork["who"] = name;
	repairWork["when"] = new Date(date).toJSON();
	repairWork["what"] = $("#addWorkSelector").val();
	repairWork["note"] = $("#noteTextInput").val();
	
	var logEntry = JSON.parse("{}");
	logEntry["who"] = name;
	logEntry["when"] = repairWork["when"];
	var somethingChanged = false;
	if(editingIndex>=0)
	{
		var oldWork = currentRepairJSON["workCompleted"][editingIndex]["what"];
		var oldNote = currentRepairJSON["workCompleted"][editingIndex]["note"];
		var oldName = currentRepairJSON["workCompleted"][editingIndex]["who"];
		var somethingChanged = false;
		if(oldWork!=repairWork["what"])
		{
			logEntry["what"] = "edited work entry "+editingIndex+": "+oldWork+" -> "+repairWork["what"];
			somethingChanged = true;
		}
		else if(oldNote!=repairWork["note"])
		{
			logEntry["what"] = "edited work note "+editingIndex+": "+oldNote+" -> "+repairWork["note"];
			somethingChanged = true;
		}
		else if(oldName!=repairWork["who"])
		{
			logEntry["what"] = "edited work author "+editingIndex+": "+oldName+" -> "+repairWork["who"];
			somethingChanged = true;
		}
		currentRepairJSON["workCompleted"][editingIndex] = repairWork;
		startLoadingSaving("Saving edited work...");
		editingIndex = -1;
	}
	else
	{
		logEntry["what"] = "added work: "+$("#addWorkSelector").val();
		somethingChanged = true;
		currentRepairJSON["workCompleted"].push(repairWork);
		startLoadingSaving("Saving added work...");
	}
	if(somethingChanged)//false if they opened to edit but didnt change anything
	{
		currentRepairJSON["logs"].push(logEntry);
	}
	figureOutColorAndStatus();
	addedWorkRefNum = refNumIn;
	window.api.send("toMain", "s"+JSON.stringify(currentRepairJSON));
	addWorkToast.hide();
	closeSaveAsPopover();
	freezeForm();
}
function saveWork()
{
	saveWorkAs(loggedInAs);
}
function resetAddWork()
{
	$("#addWorkTitle").text("Add Work");
	editingIndex = -1;
	var date = new Date();
	//var dateStr = date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2, '0')+"-"+String(date.getDate()).padStart(2, '0');
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	$("#addWorkDate").val(date.toISOString().slice(0,16));
	$("#noteTextInput").val("");
	$("#addWorkSelector").val("Submitted Claim");
	$("#deleteButtonCol").hide();
}
function addWork()
{
	resetAddWork();
	addWorkToast = new bootstrap.Toast($('#addWorkToast'));
	addWorkToast.show();
}
function selectLoginPill(name)
{
	loggedInAs = name;
	$(".workEditPencil").show();
	setRepaColor(config.employees[name].color);
	$("#addWorkButton").text("Add Work");
	$("#addWorkButton").removeClass("btn-secondary");
	$("#addWorkButton").addClass("btn-success");
	$("#loggedInAsLabel").text("Logged in as: "+name);
	$("#issueLoanerButton").prop('disabled', false);
	loginToast.hide();
}
function showLoginToast()
{	
	loginToast = new bootstrap.Toast($('#loginToast'));
	loginToast.show();
}
function addWorkLogin()
{
	if(loggedInAs=="")
	{	
		showLoginToast();
	}
	else
	{
		addWork();
	}
}
function editRepairPencil()
{
	$("#customerNameEditForm").val(currentRepairJSON["name"]);
	$("#emailEditForm").val(currentRepairJSON["email"]);
	$("#phoneEditForm").val(currentRepairJSON["phone"]);
	$("#serialEditForm").val(currentRepairJSON["serial"]);
	$("#makeEditForm").val(currentRepairJSON["make"]);
	$("#modelEditForm").val(currentRepairJSON["model"]);
	$("#warrEditForm").val(currentRepairJSON["warranty"]);
	$("#accEditForm").val(currentRepairJSON["acc"]);
	$("#probEditForm").val(currentRepairJSON["problem"]);
	$("#notesEditForm").val(currentRepairJSON["intakeNotes"]);
	$("#iPadSerialEditForm").val(currentRepairJSON["iPadSN"]);
}
function saveEditRepair()
{
	var logEntry = JSON.parse("{}");
	logEntry["who"] = loggedInAs;
	if(logEntry["who"]=="")
	{
		logEntry["who"] = "Unknown";
	}
	logEntry["when"] = new Date().toJSON();
	var buildingLog = "";
	var newName = $("#customerNameEditForm").val();
	if(newName!=currentRepairJSON["name"])
	{
		buildingLog += " name: '"+currentRepairJSON["name"]+"' -> '"+newName+"'";
	}
	currentRepairJSON["name"] = newName;
	var newEmail = $("#emailEditForm").val();
	if(newEmail!=currentRepairJSON["email"])
	{
		buildingLog += " email: '"+currentRepairJSON["email"]+"' -> '"+newEmail+"'";
	}
	currentRepairJSON["email"] = newEmail;
	var newPhone = $("#phoneEditForm").val();
	if(newPhone!=currentRepairJSON["phone"])
	{
		buildingLog += " phone: '"+currentRepairJSON["phone"]+"' -> '"+newPhone+"'";
	}
	currentRepairJSON["phone"] = newPhone;
	var newSerial = $("#serialEditForm").val();
	if(newSerial!=currentRepairJSON["serial"])
	{
		buildingLog += " serial: '"+currentRepairJSON["serial"]+"' -> '"+newSerial+"'";
	}
	currentRepairJSON["serial"] = newSerial;
	var newMake = $("#makeEditForm").val();
	if(newMake!=currentRepairJSON["make"])
	{
		buildingLog += " make: '"+currentRepairJSON["make"]+"' -> '"+newMake+"'";
	}
	currentRepairJSON["make"] = newMake;
	var newModel = $("#modelEditForm").val();
	if(newModel!=currentRepairJSON["model"])
	{
		buildingLog += " model: '"+currentRepairJSON["model"]+"' -> '"+newModel+"'";
	}
	currentRepairJSON["model"] = newModel;
	var newWarr = $("#warrEditForm").val();
	if(newWarr!=currentRepairJSON["warranty"])
	{
		buildingLog += " warranty: '"+currentRepairJSON["warranty"]+"' -> '"+newWarr+"'";
	}
	currentRepairJSON["warranty"] = newWarr;
	var newAcc = $("#accEditForm").val();
	if(newAcc!=currentRepairJSON["acc"])
	{
		buildingLog += " acc: '"+currentRepairJSON["acc"]+"' -> '"+newAcc+"'";
	}
	currentRepairJSON["acc"] = newAcc;
	var newProblem = $("#probEditForm").val();
	if(newProblem!=currentRepairJSON["problem"])
	{
		buildingLog += " problem: '"+currentRepairJSON["problem"]+"' -> '"+newProblem+"'";
	}
	currentRepairJSON["problem"] = newProblem;
	var newiPadSN = $("#iPadSerialEditForm").val();
	if(newiPadSN!=currentRepairJSON["iPadSN"])
	{
		buildingLog += " iPadSN: '"+currentRepairJSON["iPadSN"]+"' -> '"+newiPadSN+"'";
	}
	currentRepairJSON["iPadSN"] = newiPadSN;
	var newIntakeNotes = $("#notesEditForm").val();
	if(newIntakeNotes!=currentRepairJSON["intakeNotes"])
	{
		buildingLog += " intakeNotes: '"+currentRepairJSON["intakeNotes"]+"' -> '"+newIntakeNotes+"'";
	}
	currentRepairJSON["intakeNotes"] = newIntakeNotes;
	if(buildingLog!="")//if anything actually changed, save it
	{
		buildingLog = loggedInAs+" edited repair:"+buildingLog;
		logEntry["what"] = buildingLog;
		currentRepairJSON["logs"].push(logEntry);
	}
	addedWorkRefNum = refNumIn;
	window.api.send("toMain", "s"+JSON.stringify(currentRepairJSON));
	startLoadingSaving("Saving edits to repair...");
	freezeForm();
}
function showRepair(data, refNum)
{
	unfreezeForm();
	if(loggedInAs!="")
	{	
		setRepaColor(config.employees[loggedInAs].color);
	}
	var repair = data[refNum];
	currentRepairJSON = repair;
	showRelatedRepairs(refNum);	
	$("#nameLabel").text(repair["name"]);
	$("#emailLabel").text(repair["email"]);
	$("#emailLabel").attr("data-text", repair["email"]);
	$("#phoneLabel").text(repair["phone"]);
	$("#SNLabel").text(repair["serial"]);
	$("#SNLabel").attr("data-text", repair["serial"]);
	$("#refLabel").text(repair["refNum"]);
	$("#refLabel").attr("data-text", repair["refNum"]);
	$("#refLabelLabel").attr("data-text", repair["refNum"]);
	var model = repair["make"] + " " + repair["model"];
	$("#modelLabel").text(model);
	var date = new Date(repair["startDate"]);
	var dateText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
	$("#startDateLabel").text(dateText);
	$("#warrLabel").text(repair["warranty"]);
	$("#employeeLabel").empty();
	$("#employeeLabel").append("<h5 style='margin-bottom: 0px;'>"+getPill(config.employees[repair["workCompleted"][0]["who"]]["name"], repair["workCompleted"][0]["who"], "employeeLabelPill", "")+"</h5>");
	//$("#datePickedUpLabel").empty();
	if(repair["datePicked"])
	{
		$("#pickedUpText").text("Status: Picked Up");
		$("#datePickedUpContext").show();
		$("#datePickedUpButton").hide();
		$("#datePickedUpContext").empty();
		var datePicked = new Date(repair["datePicked"]["date"]);
		var datePickedText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
		$("#datePickedUpContext").append("<h5 style='margin-bottom: 0px;'>"+getPill(datePickedText, repair["datePicked"]["who"], "pickedupLabelPill", "editDatePickedUp()")+"</h5>");
	}
	else
	{
		$("#pickedUpText").text("Status: In-Store");
		$("#datePickedUpButton").show();
		$("#datePickedUpContext").hide();
	}
	var lastTouchedDate = new Date();
	lastTouchedDate.setTime(Date.parse(repair["lastTouched"]));
	$("#statedProblemLabel").text(repair["problem"]);
	$("#accLabel").text(repair["acc"]);
	$("#intakeNotesLabel").text(repair["intakeNotes"]);
	$("#workTableBody").empty();
	if(repair["iPadSN"])
	{
		$(".iPadSerialNumberLabels").show();
		$("#iPadSNLabel").text(repair["iPadSN"]);
		$("#iPadSNLabel").attr("data-text", repair["iPadSN"]);
	}
	else
	{
		$(".iPadSerialNumberLabels").hide();
	}
	for(var i = 0; i < repair["workCompleted"].length; i++)
	{
		var date = new Date(repair["workCompleted"][i]["when"]);
		//console.log(date);
		var dateTimeText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
		var hours = date.getHours();
		var ampmindicator = "am";
		if(hours>12)
		{
			hours -= 12;
			ampmindicator = "pm";
		}
		dateTimeText += " "+hours+":"+String(date.getMinutes()).padStart(2, '0')+" "+ampmindicator;
		var html = "<tr><td scope='row'>"+dateTimeText+"</td>";
		html +="<td>"+repair["workCompleted"][i]["what"]+"</td>";
		html +="<td style='max-width: 400px; overflow:auto;'>"+repair["workCompleted"][i]["note"]+"</td>";
		html +="<td>"+getPill(config.employees[repair["workCompleted"][i]["who"]]["name"], repair["workCompleted"][i]["who"], "workCompletedLabelPill"+i, "")+"</td>";
		if(loggedInAs=="")
		{
			if(i==0)
			{
				html += "<td class='workEditPencil' style='display:none;'></td>";
			}
			else
			{
				html += "<td style='display:none;' class='workEditPencil' onclick='editPencil("+i+")'><img src='pencil.svg' style='width: 20px; height: 20px;'></img></td>";
			}
		}
		else
		{
			if(i==0)
			{
				html += "<td class='workEditPencil'></td>";
			}
			else
			{
				html += "<td class='workEditPencil' onclick='editPencil("+i+")'><img src='pencil.svg' style='width: 20px; height: 20px'></img></td>";
			}
		}
		html += "</tr>";
		$("#workTableBody").append(html);
	}
}
function showLogs()
{
	var allLogs = currentRepairJSON["logs"];
	if(!allLogs)
	{
		$("#noLogsLabel").show();
		$("#logsTable").hide();
	}
	else
	{
		$("#noLogsLabel").hide();
		$("#logsTable").show();
	}
	$("#logsTableBody").empty();
	for(i in allLogs)
	{
		var logEntry = allLogs[i];
		var building = "<tr><th scope='row'>"+logEntry["who"]+"</th>";
		var date = new Date(logEntry["when"]);
		var dateTimeText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
		var hours = date.getHours();
		var ampmindicator = "am";
		if(hours>12)
		{
			hours -= 12;
			ampmindicator = "pm";
		}
		dateTimeText += " "+hours+":"+String(date.getMinutes()).padStart(2, '0')+" "+ampmindicator;
		building += "<td>"+dateTimeText+"</td>";
		building += "<td>"+logEntry["what"]+"</td>";
		$("#logsTableBody").append(building);
	}
}
function logOut()
{
	loggedInAs = "";
	setRepaColor("black");
	$("#addWorkButton").text("Log in as a Repair Technician");
	$("#addWorkButton").addClass("btn-secondary");
	$("#addWorkButton").removeClass("btn-success");
	$("#loggedInAsLabel").text("");
	$("#issueLoanerButton").prop('disabled', true);
}
function issueLoaner()
{
	if(loggedInAs=="")
	{	
		showLoginToast();
	}
	else
	{
		
	}
}
function figureOutColorAndStatus()
{
	var color = "default";
	var status = "Unknown";
	if(currentRepairJSON["datePicked"])
	{		
		var date = new Date(currentRepairJSON["datePicked"]["when"]);
		var dateText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
		status = "Picked up on "+dateText;
		color = "light";
	}
	else
	{
		for(var i = currentRepairJSON["workCompleted"].length-1; i > 0; i--)
		{
			var work = currentRepairJSON["workCompleted"][i];
			if(work["what"]=="Sent Out")
			{
				color = "warning";
				status = "Sent Out";
				break;
			}
			if(work["what"]=="Diagnosed")
			{
				color = "secondary";
				status = "Diagnosed";
				break;
			}
			if(work["what"]=="Submitted Claim")
			{
				color = "info";
				status = "Submitted Claim";
				break;
			}
			if(work["what"]=="Submitted RFA")
			{
				color = "info";
				status = "Submitted RFA";
				break;
			}
			if(work["what"]=="Ordered Parts")
			{
				color = "info";
				status = "Ordered Parts";
				break;
			}
			if(work["what"]=="Parts Arrived")
			{
				color = "primary";
				status = "Parts Arrived";
				break;
			}
			if(work["what"]=="Finished")
			{
				color = "success";
				status = "Finished";
				break;
			}
		}
	}
	currentRepairJSON["color"] = color;
	currentRepairJSON["status"] = status;
}
function reprintForm()
{
	$("#savingDisplay").hide();
	$("#repairForm").show();
	$("#repairEdit").hide();
	var whoDidIt = currentRepairJSON["workCompleted"][0]["who"];
	$("#RepaPart").css("color", config["employees"][whoDidIt]["color"]);
	fillPrintingFill(whoDidIt);
	$("#RefNumLabel").text("Ref. Number: "+currentRepairJSON["refNum"]);
	$("#serialForm").val(currentRepairJSON["serial"]);
	genbar();
	$("#nameForm").val(currentRepairJSON["name"]);
	var date = new Date(currentRepairJSON["startDate"]);
	$("#dateForm").val(date.toISOString().slice(0,16));
	$("#emailForm").val(currentRepairJSON["email"]);
	$("#accForm").val(currentRepairJSON["acc"]);
	$("#intakeTextArea").val(currentRepairJSON["intakeNotes"]);
	$("#phoneForm").val(currentRepairJSON["phone"]);
	$("#purchForm").val(currentRepairJSON["purchaseDate"]);
	if(currentRepairJSON["iPadSN"])
	{
		$("#iPadSN").val(currentRepairJSON["iPadSN"]);
		$("#iPadSNDiv").show();
		$("#passwordDiv").hide();
	}
	else
	{
		$("#iPadSNDiv").hide();
		$("#passwordDiv").show();
	}
	dontOverrideProblem = true;
	$("#problemSelector").val("Other");
	$("#problemTextArea").val(currentRepairJSON["problem"]);
	dontOverrideWarranty = true;
	$("#warrantyOtherText").val(currentRepairJSON["warranty"]);
	selectedMakeName = currentRepairJSON["make"];
	selectedModelName = currentRepairJSON["model"];
	subType = "";
	printing = true;
	makeRepairPrintable();
	window.print();
	unMakeRepairPrintable();
	dontOverrideWarranty = false;
	dontOverrideProblem = false;
	$("#repairForm").hide();
	$("#repairEdit").show();
}
var pickedUpModal;
function removeFirstEditWorkEmployee()
{
	if($("#editDateWorkerSelector").find("option:first").text()=="")
	{
		$("#editDateWorkerSelector").find("option:first").remove();
	}	
	if(repairEditFrozen)
	{
		$("#saveDatePickedUpButton").addClass("editWorkButtons");
	}
	else
	{
		$("#saveDatePickedUpButton").removeClass("editWorkButtons");
		$("#saveDatePickedUpButton").prop("disabled", false);
	}
}
function saveDatePickedUp()
{
	var date = new Date($("#dateEditPickedUpForm").val());
	currentRepairJSON["datePicked"] = {};
	currentRepairJSON["datePicked"]["when"] = date.toJSON();
	currentRepairJSON["datePicked"]["who"] = $("#editDateWorkerSelector").val();
	
	var logEntry = JSON.parse("{}");
	logEntry["who"] = currentRepairJSON["datePicked"]["who"];
	logEntry["when"] = currentRepairJSON["datePicked"]["when"];
	logEntry["what"] = "Marked repair as picked up";
	currentRepairJSON["logs"].push(logEntry);
	
	figureOutColorAndStatus();
	addedWorkRefNum = refNumIn;
	window.api.send("toMain", "s"+JSON.stringify(currentRepairJSON));
	freezeForm();
	startLoadingSaving("Saving picked up...");
	var myModalEl = document.getElementById('pickupModal');
	var modal = bootstrap.Modal.getInstance(myModalEl);
	modal.hide();
}
function fillPickedUpDate()
{
	var date = new Date();
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	$("#dateEditPickedUpForm").val(date.toISOString().slice(0,16));
	$("#saveDatePickedUpButton").prop("disabled", true);
	
	$("#editDateWorkerSelector").empty();
	$("#editDateWorkerSelector").append(
		"<option value=\"\" selected></option>"
	);
	for (var employee in config.employees) 
	{
		if(config.employees[employee]["black-text"])
		{
			$("#editDateWorkerSelector").append(
				"<option value=\""+employee+"\" style=\"background-color: "+config.employees[employee]["color"]+";\">"+config.employees[employee]["name"]+"</option>"
			);
		}
		else
		{
			$("#editDateWorkerSelector").append(
				"<option value=\""+employee+"\" style=\"color: white; background-color: "+config.employees[employee]["color"]+";\">"+config.employees[employee]["name"]+"</option>"
			);
		}
	}
}
function editDatePickedUp()
{
	var date = new Date(currentRepairJSON["datePicked"]["when"]);
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	$("#dateEditPickedUpForm").val(date.toISOString().slice(0,16));
	$("#editDateWorkerSelector").val(currentRepairJSON["datePicked"]["who"]);
	pickedUpModal = new bootstrap.Modal($('#pickupModal'));
	pickedUpModal.show();
}