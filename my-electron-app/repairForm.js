$(document).on('input', '.validable', function () {
	//console.log(event.target.value);
	validateInputElement(event.target);
});
$(document).on("keyup", '#emailForm', function(e) {
	var value = $("#emailForm").val();
	if(/^[a-z]*[.,](\d+)$/.test(value))
	{
		if (e.keyCode == 13) {
			findPerson();
		}
	}
});
$(document).on("change", "#problemSelector", function () {
	//text = event.target.innerHTML;
	//alert();
	var value = $(this).find("option:selected").attr("showproblem");
	if(value=="true")
	{
		$("#problemBox").show();
	}
	else
	{
		$("#problemBox").hide();
	}
});
function resetRepairForm()
{
	gettingNextRefNum = false;
	referenceNumber = -1;
	$("#RefNumLabel").text("Ref. Number: ???");
	saveNow = false;
	var date = new Date();
	//var dateStr = date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2, '0')+"-"+String(date.getDate()).padStart(2, '0');
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	$("#dateForm").val(date.toISOString().slice(0,16));
	//alert(dateStr);
	//$("#dateForm").val(dateStr);
	//$("#repairFormBack").prop("disabled", true);
	setupMakes();
	setupWarranties();
	selectPill();
	
	$("#intakeTextArea").val("");
	$("#nameForm").val("");
	$("#serialForm").val("");
	$("#emailForm").val("");
	$("#warrantyOtherText").val("");
	$("#makeOtherBox").val("");
	$("#typeOtherBox").val("");
	$("#accForm").val("");
	$("#purchForm").val("");
	$("#phoneForm").val("");
	$("#problemBox").val("");
	$("#problemBox").hide();
	$("#makeOtherBox").hide();
	$("#problemSelector").hide();
	$("#typeSelectors").empty();
	$("#typeOtherBox").show();
	$("#ACAck").prop("checked", false);
	$("#FMAck").prop("checked", false);
	$("#flexSwitchCheckCheckedDepartmental").prop("checked", false);
	$("#flexSwitchCheckCheckedFlagship").prop("checked", false);
	$("#digitalFlagshipSwitch").hide();
	$("#nameForm").addClass("is-invalid");
	$("#emailForm").addClass("is-invalid");
	$("#serialForm").addClass("is-invalid");
	$("#warrantySelector").addClass("is-invalid");
	$("#typeOtherBox").addClass("is-invalid");
	$("#workerSelector").focus();
}
function validateInputElement(ele)
{
	if(ele.value!="")
	{
		$("#"+ele.id).addClass("is-valid");
		$("#"+ele.id).removeClass("is-invalid");
	}
	else
	{
		$("#"+ele.id).removeClass("is-valid");
		$("#"+ele.id).addClass("is-invalid");
	}
}
function warrantySelected()
{
	if($("#warrantySelector").val()=="Other")
	{
		$("#warrantyOtherText").show();
	}
	else
	{
		$("#warrantyOtherText").hide();
	}
	$("#warrantySelector").addClass("is-valid");
	$("#warrantySelector").removeClass("is-invalid");
}
function findPerson()
{
	var osuFindPeopleURL = "https://www.osu.edu/findpeople/";
	//var xhr = new XMLHttpRequest();
	//xhr.open("POST", yourUrl, true);
	//xhr.setRequestHeader('Content-Type', 'application/json');
	//xhr.send("lastname=&firstname=&name_n=fojtik.6&filter=All");
	$("#nameForm").removeClass("is-valid");
	$("#nameForm").removeClass("is-invalid");
	$("#emailForm").removeClass("is-valid");
	$("#emailForm").removeClass("is-invalid");
	$.post(osuFindPeopleURL,
	{
		lastname: "",
		firstname: "",
		name_n: $("#emailForm").val(),
		filter: "All"
	},
	function(data, status){
		//console.log(data);
		returnedElements = $($.parseHTML(data));
		var table = returnedElements.find("#person1");
		var name = "";
		var email = "";
		var child = table.children().eq(1).children().first();
		//console.log("start");
		while(child.html())
		{
			var type = child.children().first().text();
			if(type.trim()=="Name:")
			{
				name = child.children().eq(1).text();
			}
			if(type.trim()=="Published Email Address:")
			{
				email = child.children().eq(1).text();
			}
			//console.log(type);
			//console.log(":"+child.html());
			child = child.next();
		}
		//validateInputElement($("#dotForm")[0]);
		if(email!="")
		{
			$("#emailForm").val(email);
		}
		validateInputElement($("#emailForm")[0]);
		//$("#emailForm").trigger("input");
		if(name!="")
		{
			$("#nameForm").val(name);
			validateInputElement($("#nameForm")[0]);
		}
		else
		{
			$("#nameForm").removeClass("is-valid");
			$("#nameForm").addClass("is-invalid");
		}
		//$("#nameForm").trigger("input");
		//alert(name+"\t"+email);
		//alert("Data: " + data + "\nStatus: " + status);
	});
}
var selectedEmployee;
function selectPill(name)//pass null if you want to reset pills
{
	selectedEmployee = name;
	var allPills = $(".workerSelect").children();
	var thePill;
	for(var i = 0; i < allPills.length; i++)
	{
		var theName = allPills[i].getAttribute("employee");
		markDeselectedPill(allPills[i], theName);
		if(theName==name)
		{
			thePill = allPills[i];
		}
	}
	if(thePill)
	{
		markSelectedPill(thePill, name);
		validateSaveButtons();
	}
}
function fillPrintingFill(theName)
{	
	$("#printingPill").css("background-color", config.employees[theName].color);
	$("#printingPill").css("border-color", config.employees[theName].color);
	$("#printingPill").text(config.employees[theName]["name"]);
	if(config.employees[theName]["black-text"])
	{
		$("#printingPill").addClass("text-dark");
	}
	else
	{
		$("#printingPill").removeClass("text-dark");
	}
}
function markSelectedPill(thePill, theName)
{
	setRepaColor(config.employees[theName].color);
	//$("#RepaPart").css("color", config.employees[theName].color);
	var styling = 'background-color: '+config.employees[theName].color+'; '+'border-color: '+config.employees[theName].color+';';
	thePill.style = styling;
	fillPrintingFill(theName);
	if(config.employees[theName]["black-text"])
	{
		thePill.className = 'badge rounded-pill badge-spaced text-dark';
	}
	else
	{
		thePill.className = 'badge rounded-pill badge-spaced';
	}
}
function markDeselectedPill(thePill, theName)
{
	thePill.className = 'badge rounded-pill badge-not-selected text-dark badge-spaced';
	thePill.style = 'border-color: '+config.employees[theName].color+';';
}
function validateSaveButtons()
{
	var pillSelected = false;
	var allPills = $(".workerSelect").children();
	for(var i = 0; i < allPills.length; i++)
	{
		if(!allPills[i].className.includes("badge-not-selected"))
		{
			pillSelected = true;
		}
	}
	//console.log($("#emailForm").val()!="");
	var good = $("#problemSelector").is(":visible") && $("#nameForm").val()!="" && $("#warrantySelector").val()!="" && $("#serialForm").val()!="" && $("#emailForm").val()!="" && pillSelected && ((neediPadSN && $("#iPadSN").val()!="") || !neediPadSN);
	var makeGood = ($("#makeOtherBox").is(":visible") && $("#makeOtherBox").val()!="") || !$("#makeOtherBox").is(":visible");
	var typeGood = ($("#typeOtherBox").is(":visible") && $("#typeOtherBox").val()!="") || !$("#typeOtherBox").is(":visible");
	var warrantyGood = ($("#warrantyOtherText").is(":visible") && $("#warrantyOtherText").val()!="") || !$("#warrantyOtherText").is(":visible");
	//console.log(hasSubType);
	var subTypeGood = !hasSubType || (hasSubType && subType!="");
	var problemGood = $("#problemSelector").val()!="Click here to enter problem";
	good = good && makeGood && typeGood && warrantyGood && subTypeGood && problemGood;
	if(good)
	{
		getNextRefNum();
		$(".saveButton").prop('disabled', false);
	}
	else
	{
		$(".saveButton").prop('disabled', true);
	}
	var warning = ($("#problemSelector").val()=="" && $("#problemSelector").is(":visible")) || ($("#problemTextArea").val()=="" && $("#problemTextArea").is(":visible"));
	if(warning)
	{
		$(".saveButton").removeClass("btn-primary");
		$(".saveButton").addClass("btn-warning");
	}
	else
	{
		$(".saveButton").addClass("btn-primary");
		$(".saveButton").removeClass("btn-warning");
	}
}
var commonProblems;
var selectedMake;
var selectedMakeName;
function makeSelect(name)
{
	var configBrand = "Other";
	for(var brand in config.repairables)
	{
		//console.log(config.repairables[brand].commonName+"\t"+selectedMake);
		if(config.repairables[brand].commonName==name)
		{
			configBrand = brand;
		}
	}
	$("#problemSelector").empty();
	$("#problemSelector").hide();
	$("#problemBox").hide();
	//$("#problemSelectorRow").removeClass("hideWhenPrint");
	//console.log(commonProblems);
	var allMakes = $("#makeSelector").children();
	var theMake;
	for(var i = 0; i < allMakes.length; i++)
	{
		var theName = allMakes[i].innerHTML;
		allMakes[i].className = 'btn btn-outline-success';
		if(theName==name)
		{
			theMake = allMakes[i];
		}
	}
	$("#digitalFlagshipSwitch").hide();
	if(theMake.innerHTML=='Other')
	{
		$("#makeOtherBox").show();
		showProblemSelector(["Click here to enter problem"]);
	}
	else
	{
		$("#makeOtherBox").hide();
	}
	selectedMake = theMake.innerHTML;
	selectedMakeName = selectedMake;
	theMake.className = 'btn btn-success';
	updateTypes();
	validateSaveButtons();
	disposePopover();
}
var subType = "";
var subTypePopover;
var hasSubType = false;
function subTypeSelect(index)
{
	var subTypeChildren = $("#subTypeButtonGroup").children();
	for(var i = 0; i < subTypeChildren.length; i++)
	{
		$("#"+subTypeChildren[i].id).addClass("is-valid");
		$("#"+subTypeChildren[i].id).removeClass("is-invalid");
	}
	disposePopover();
	subType = " "+indexToName[index];
	validateSaveButtons();
}
var indexToName = [];
function updateTypes()
{
	$("#typeSelectors").empty();
	subType = "";
	/*$("#typeSelectors").append(
		"<span class=\"input-group-text\" id=\"basic-addon11\">Type</span>"
	);*/
	var theMake = "Other";
	for(var brand in config.repairables)
	{
		//console.log(config.repairables[brand].commonName+"\t"+selectedMake);
		if(config.repairables[brand].commonName==selectedMake)
		{
			theMake = brand;
		}
	}
	if(theMake=="Other")
	{
		$("#typeOtherBox").show();
		//$("#typeSelectors").append(
			//"<input id='typeOtherBox' type=\text\" class=\"form-control validable\" placeholder=\"Specify\" aria-label=\"Specify\">"
		//);
	}
	else
	{
		var typeCounter = 0;
		for(var device in config.repairables[theMake].devices)
		{
			var deviceProperties = config.repairables[theMake].devices[device];
			if(device=="Other" && deviceProperties)
			{
				$("#typeSelectors").append(
					"<button id=\"typeOther\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"typeSelect('typeOther')\">Other</button>"
				);
			}
			else
			{
				if(deviceProperties.types)
				{
					var content = "<div class='input-group' id='subTypeButtonGroup'>";
					for(var i = 0; i < deviceProperties.types.length; i++)
					{
						var subTypeName = deviceProperties.types[i];
						indexToName[typeCounter] = subTypeName;
						content += ("<button id='subtype"+subTypeName+"' type='button' class='btn btn-outline-danger' onclick='subTypeSelect("+typeCounter+")'>"+subTypeName+"</button>");
						typeCounter++;//have to do this hacky way of talking about types because I cant " or '
					}
					content += "</div>";
					$("#typeSelectors").append(
						"<button id=\"type"+device+"\" type=\"button\" class=\"btn btn-outline-danger\" data-bs-container=\"body\" data-bs-toggle=\"popover\" data-bs-placement=\"bottom\" data-bs-content=\""+content+"\" onclick=\"typeSelect('type"+device+"')\">"+deviceProperties.commonName+"</button>"
					);
					$("#type"+device).on('hidden.bs.popover', function (arg) {
						//console.log(arg);
						bootstrap.Popover.getInstance(arg.target).dispose();
					});
				}
				else
				{
					$("#typeSelectors").append(
						"<button id=\"type"+device+"\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"typeSelect('type"+device+"')\">"+deviceProperties.commonName+"</button>"
					);
				}
			}
		}
		$("#typeOtherBox").hide();
		/*$("#typeSelectors").append(
			""
		);*/
	}
							//<button id="typeOtherMicrosoft" type="button" class="btn btn-outline-primary" onclick="typeSelect('typeOtherMicrosoft')">Other</button>
}
function showProblemSelector(commonProblems)
{	
	$("#problemSelector").addClass("is-invalid");
	$("#problemSelector").removeClass("is-valid");
	for(var i = 0;i < commonProblems.length; i++)//compile them all
	{
		$("#problemSelector").append(
			"<option value=\""+commonProblems[i]+"\" class=\"clickableProblem\">"+commonProblems[i]+"</option>"
		);
	}
	$("#problemSelector").append(//add the ends
		"<option value=\"Multiple\" class=\"clickableProblem\" showproblem=\"true\">Multiple Issues, written in problem box</option>"
	);
	$("#problemSelector").append(
		"<option value=\"Other\" class=\"clickableProblem\" showproblem=\"true\">Other, written in problem box</option>"
	);
	$("#problemSelector").show();//always show
	validateSaveButtons();
}
var neediPadSN = false;
var selectedModelName;
var findMyWarningRequired;
var appleCareWarningRequired;
var popoverDisposed = true;
function disposePopover()
{
	if(!popoverDisposed)
	{
		subTypePopover.hide();
		popoverDisposed = true;
	}
}
function typeSelect(id)
{
	subType = "";
	$("#problemBox").hide();
	//$("#problemSelectorRow").removeClass("hideWhenPrint");
	var allTypes = $("#typeSelectors").find('button');
	var theTypeElement;
	for(var i = 0; i < allTypes.length; i++)
	{
		var theName = allTypes[i].id;
		allTypes[i].className = 'btn btn-outline-success';
		//var exampleEl = document.getElementById('example');
		if(theName==id)
		{
			selectedModel = theName.replace("type","");
			//console.log(selectedModel);
			theTypeElement = allTypes[i];
		}
	}
	disposePopover();	
	//console.log(theTypeElement);
	hasSubType = false;
	if(theTypeElement.getAttribute('data-bs-toggle')=="popover")//has popover stuff
	{
		var popovertype = new bootstrap.Popover(theTypeElement,{
			html: true,
			sanitize: false,
		 });
		popovertype.update();
		popovertype.show();
		//console.log(subTypePopover);
		subTypePopover = popovertype;
		popoverDisposed = false;
		hasSubType = true;
	}
	var theMake = "Other";
	for(var brand in config.repairables)
	{
		//console.log(config.repairables[brand].commonName+"\t"+selectedMake);
		if(config.repairables[brand].commonName==selectedMake)
		{
			theMake = brand;
		}
	}
	commonProblems = ["Click here to enter problem"];//all devices start with nothing selected
	if(theMake!="Other")
	{
		var theType = "Other";
		for(var type in config.repairables[theMake].devices)
		{
			if(config.repairables[theMake].devices[type].commonName==theTypeElement.innerHTML)
			{
				theType = type;
			}
		}
		//console.log(config.repairables[theMake].devices[theType]);
		findMyWarningRequired = config.repairables[theMake].devices[theType].findMy==true;
		selectedModelName = theTypeElement.innerHTML;
		$("#problemSelector").empty();
		if(config.repairables[theMake].commonProblems)//get common problems of brand
		{
			for(var i = 0; i < config.repairables[theMake].commonProblems.length; i++)
			{
				commonProblems.push(config.repairables[theMake].commonProblems[i]);
			}
		}
		if(theType!="Other")
		{
			if(config.repairables[theMake].devices[theType].iPadSerialNumber)
			{
				neediPadSN = true;
				$("#iPadSNDiv").show();
				$("#passwordDiv").hide();
			}
			else
			{
				neediPadSN = false;
				$("#iPadSNDiv").hide();
				$("#passwordDiv").show();
			}
			if(config.repairables[theMake].devices[theType].commonProblems)//get common problems of type
			{
				for(var i = 0; i < config.repairables[theMake].devices[theType].commonProblems.length; i++)
				{
					commonProblems.push(config.repairables[theMake].devices[theType].commonProblems[i]);
				}
			}
			//console.log(commonProblems);
			i++;
			if(config.repairables[theMake].devices[theType].digitalFlagshipSwitch)
			{
				$("#digitalFlagshipSwitch").show();
			}
			else
			{
				$("#digitalFlagshipSwitch").hide();
			}
		}
	}
	else
	{
		$("#digitalFlagshipSwitch").hide();
	}
	showProblemSelector(commonProblems);
	if(theTypeElement.innerHTML=='Other')
	{
		$("#typeOtherBox").show();
	}
	else
	{
		$("#typeOtherBox").hide();
	}
	theTypeElement.className = 'btn btn-success';
	validateSaveButtons();
}
function removeFirstProblem()
{
	//console.log("\""+$("#problemSelector").find("option:first")+"\"");
	if($("#problemSelector").find("option:first").text()=="Click here to enter problem")
	{
		$("#problemSelector").find("option:first").remove();
	}
	$("#problemSelector").addClass("is-valid");
	$("#problemSelector").removeClass("is-invalid");
}
function removeFirstWarranty()
{
	//console.log("\""+$("#problemSelector").find("option:first")+"\"");
	if($("#warrantySelector").find("option:first").text()=="")
	{
		$("#warrantySelector").find("option:first").remove();
	}
}
window.api.receive("fromMainSaveFail", (data) => 
{
	console.log(e);
	$("#mainError").show();
	$("#container").hide();
	$("#mainError").text("There is an error with the backend json file, can't load");
});
window.api.receive("fromMainSaveSuc", (data) => 
{
	doneLoadingSaving();
	if(addedWorkRefNum>0)
	{
		backendData = JSON.parse(data);
		showRepair(backendData["repairs"], addedWorkRefNum);
		addedWorkRefNum = 0;
	}
	else
	{
		setTimeout(backToMain, 400);
	}
});
function backToMain()
{
	if(printing)
	{
		unMakeRepairPrintable();
	}
	loadAll();
	$( "#mainTable" ).show();
	$( "#repairForm" ).hide();
	$( "#repairEdit" ).hide();
	$("#startNewRepairButton").prop('disabled', true);
}
var appleCareWarningRequired;
function showRelaText()
{
	var none = true;
	if(appleCareWarningRequired && appleCareRequiresFee)
	{
		none = false;
		$("#appleCareWarning").show();
	}
	else
	{
		$("#appleCareWarning").hide();
	}
	if(findMyWarningRequired && appleFindMyWarning)
	{
		none = false;
		$("#findWarning").show();
	}
	else
	{
		$("#findWarning").hide();
	}
	if(none)
	{
		console.log("configuartion says disable findmy or applecare warning but we need one to show, failsafing....");
		appleWarningEnabled = false;
		saveRepairForm();
	}
}
var printing = false;
function saveRepairForm()
{
	appleCareWarningRequired = $("#warrantySelector").val()=="AppleCare+";
	//console.log(appleWarningEnabled+":"+appleCareWarningRequired+":"+findMyWarningRequired);
	printing = false;
	if(appleWarningEnabled && (appleCareWarningRequired || findMyWarningRequired))
	{
		showRelaText();
		$("#container").hide();
		$("#repairFormWarning").show();
	}
	else
	{
		okayWarning();
	}
}
function saveAndPrintRepairForm()
{
	appleCareWarningRequired = $("#warrantySelector").val()=="AppleCare+";
	printing = true;
	if(appleWarningEnabled && (appleCareWarningRequired || findMyWarningRequired))
	{
		showRelaText();
		$("#container").hide();
		$("#repairFormWarning").show();
	}
	else
	{
		okayWarning();
	}
}
function warningAck()
{
	var acgood = (($("#ACAck").is(":checked") && appleCareWarningRequired) || !appleCareWarningRequired);
	var fmgood = (($("#FMAck").is(":checked") && findMyWarningRequired) || !findMyWarningRequired);
	var good = acgood && fmgood;
	if(good)
	{
		okayWarning();
	}
}
function sendSave()
{
	startLoadingSaving("Saving...");
	window.api.send("toMain", "s"+jsonifyTheRepairForm());
	if(printing)
	{
		makeRepairPrintable();
		window.print();
	}
}
var saveNow = false;
function okayWarning()
{
	$("#container").show();
	$("#repairFormWarning").hide();
	if(referenceNumber==-1)
	{
		getNextRefNum();
		saveNow = true;
	}
	else
	{
		sendSave();
	}
}
var referenceNumber = -1;
function jsonifyTheRepairForm()
{
	var json = JSON.parse("{}");
	json["refNum"] = referenceNumber;
	//json["employee"] = selectedEmployee; taken care of in first work entry
	//json["dotNumber"] = $("#dotForm").val();
	//json["dateForm"] = $("#dateForm").val(); 
	json["name"] = $("#nameForm").val();
	json["serial"] = $("#serialForm").val();
	json["email"] = $("#emailForm").val();
	json["startDate"] = new Date($("#dateForm").val()).toJSON();
	json["acc"] = $("#accForm").val();
	json["intakeNotes"] = $("#intakeTextArea").val();
	json["phone"] = $("#phoneForm").val();
	json["purchaseDate"] = $("#purchForm").val();
	json["color"] = "default";
	if(neediPadSN && $("#iPadSN").val()!="")
	{
		json["iPadSN"] = $("#iPadSN").val();
	}
	else
	{
		json["iPadSN"] = "";
	}
	//json["lastTouched"] = new Date().toJSON();
	var problem = $("#problemSelector").val();
	if(problem=="Other" || problem=="Multiple")
	{
		json["problem"] = $("#problemTextArea").val();
	}
	else
	{
		json["problem"] = problem;
	}
	var warranty = $("#warrantySelector").val();
	if(warranty=="Other")
	{
		json["warranty"] = $("#warrantyOtherText").val();
	}
	else
	{
		json["warranty"] = warranty;
	}
	if(selectedMakeName=="Other")
	{
		json["make"] = $("#makeOtherBox").val();
	}
	else
	{
		json["make"] = selectedMakeName;
	}
	if(selectedModelName=="Other" || selectedMakeName=="Other")
	{
		json["model"] = $("#typeOtherBox").val();
	}
	else
	{
		json["model"] = selectedModelName+subType;
	}
	json["status"] = "Created Repair Form";
	var date = new Date();
	json["logs"] = [{"who": selectedEmployee, "what": "Created the repair", "when": date.toJSON()}];
	//date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	json["workCompleted"] = [{"who": selectedEmployee, "when": date.toJSON(), "what": "Created Repair Form", "note": ""}];
	return JSON.stringify(json);
}
window.api.receive("fromMainRefNum", (data) => 
{
	doneLoadingSaving();
	$("#RefNumLabel").text("Ref. Number: "+data);
	referenceNumber = data;
	$("#repairFormBack").prop("disabled", false);
	if(saveNow)
	{
		sendSave();
	}
	//console.log('Received ${'+data+'} from main process');
});
var gettingNextRefNum = false;
function getNextRefNum()
{
	if(referenceNumber==-1 && !gettingNextRefNum)
	{
		gettingNextRefNum = true;
		$("#RefNumLabel").text("Ref. Number: ???");
		startLoadingSaving("Getting next reference number...");
		window.api.send("toMain", "incRefNum");
	}
}
function makeRepairPrintable()
{
	$("#warrantySelector").hide();
	if($("#warrantySelector").val()!="Other" && !dontOverrideWarranty)
	{
		//console.log("overriding");
		$("#warrantyOtherText").val($("#warrantySelector").val());
	}
	var needToOverrideProblem = $("#problemSelector").find("option:selected").attr("showproblem")!="true";
	if(needToOverrideProblem && !dontOverrideProblem)
	{
		$("#problemTextArea").val($("#problemSelector").val());
	}
	$(".is-invalid").each(function(){
		$(this).addClass("is-invalid-printed");
		$(this).removeClass("is-invalid");
	});
	$(".is-valid").each(function(){
		$(this).addClass("is-valid-printed");
		$(this).removeClass("is-valid");
	});
	$("#phoneForm").prop("placeholder", "");
	$("#allTheMakes").hide();
	$("#printMake").val(selectedMakeName);
	$("#allTheModels").hide();
	$("#printModel").val(selectedModelName+subType);
	var isFlagship = $("#flexSwitchCheckCheckedFlagship").is(":checked") && $("#flexSwitchCheckCheckedFlagship").is(":visible");
	var isDepartmental = $("#flexSwitchCheckCheckedDepartmental").is(":checked") && $("#flexSwitchCheckCheckedDepartmental").is(":visible");
	var intakeText = $("#intakeTextArea").val();
	var hasText = $("#intakeTextArea").val()!="";
	intakeText += isFlagship ? (hasText ? ", " : "")+"Flagship Device" : "";
	hasText = intakeText!="";
	intakeText += isDepartmental ? (hasText ? ", " : "")+"Departmental Device" : "";
	$("#intakeTextArea").val(intakeText);
	$(".hideWhenPrint").each(function(){
		$(this).hide();
	});
	$(".showWhenPrint").each(function(){
		$(this).show();
	});
	$("#passwordForm").prop('disabled', false);
	$("#passwordForm").val("");
	$("#mainTitle").css("font-size", "75px");
	$("#techLogo").css("height", "80px");
	$("#dateFormPrint").val(new Date($("#dateForm").val()).toDateString());
	const d = new Date();
	var dateTimeText = String(d.getMonth()+1).padStart(2, '0')+"/"+String(d.getDate()).padStart(2, '0')+"/"+d.getFullYear();
	var hours = d.getHours();
	var ampmindicator = "am";
	if(hours>11)
	{
		ampmindicator = "pm";
	}
	if(hours>12)
	{
		hours -= 12;
	}
	dateTimeText += " "+hours+":"+String(d.getMinutes()).padStart(2, '0')+" "+ampmindicator;
	$("#dateTimeLabel").text(dateTimeText);
	$("#nameLabelBottom").text($("#nameForm").val());
	$("#versionLabel").css("padding-top", "75px");
	$("#versionLabel").css("font-size", "1rem");
	//$("#loggedInAsLabel").text("v"+version);
}
function unMakeRepairPrintable()
{
	$("#warrantySelector").show();
	$(".is-invalid").each(function(){
		$(this).addClass("is-invalid-printed");
		$(this).removeClass("is-invalid");
	});
	$(".is-valid").each(function(){
		$(this).addClass("is-valid-printed");
		$(this).removeClass("is-valid");
	});
	$("#phoneForm").prop("placeholder", "614-292-8883");
	$("#allTheMakes").show();
	$("#allTheModels").show();
	$("#intakeTextArea").val("");
	$(".hideWhenPrint").each(function(){
		$(this).show();
	});
	$(".showWhenPrint").each(function(){
		$(this).hide();
	});
	$("#passwordForm").prop('disabled', true);
	$("#passwordForm").val("Written in after printing");
	$("#mainTitle").css("font-size", "");
	$("#techLogo").css("height", "");
	$("#versionLabel").css("padding-top", "94px");
	$("#versionLabel").css("font-size", "1.25rem");
	//$("#loggedInAsLabel").text("");
}
function genbar()
{
	JsBarcode("#barcode", $("#serialForm").val(), {
	  width: 1,
	  height: 20,
	  displayValue: false,
	  fontSize: 10
	});
	$("#barcode").css("float", "right");
}