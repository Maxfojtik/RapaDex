function startLoadingSaving(message)
{
	$("#saveText").text(message);
	//$("#saveSpinner").css("visibility", "visible");
	$("#savingDisplay").css("display", "flex").hide().fadeIn();
	//$("#savingDisplay").addClass("d-flex");
	$("#pokeImage").addClass("shaker");
	$("#pokeImage").removeClass('shakers');
	$(".starImage").css("visibility", "shown");
	$("#pokeStars").hide();
	stopShaking = false;
}
function doneLoadingSaving()
{
	$("#savingDisplay").css("color", "black");
	//$("#saveSpinner").css("visibility", "hidden");
	stopShaking = true;
}
var stopShaking = false;
var building = "";
var version = "1.0.3";
function keyDownHandler(event)
{
	if(event.key=='Escape' && !$("#savingDisplay").is(":visible"))//hacky but each screen has their own variables to tell if they are frozen or whatever
	{
		backToMain();
	}
	if(collectKeyboard)
	{
		building += event.key;
		for(employee in config.employees)
		{
			var em = config.employees[employee];
			if(building.includes(em.abr))
			{
				building = "";
				selectPill(employee);
				//alert(employee);
			}
		}
	}
	//console.log(event);
}
function initPopovers()
{
	$.fn.tooltip.Constructor.Default.allowList['*'].push('style');
	$.fn.tooltip.Constructor.Default.allowList['*'].push('onclick');
	var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
	var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
	  return new bootstrap.Popover(popoverTriggerEl);
	});
}
$( document ).ready(function() {
	loadConfiguration();
	$( "#searchInput" ).select();
	document.addEventListener('keydown', keyDownHandler);
	setTimeout(initPopovers, 500);
	$("#versionLabel").text("v"+version);
	$('#pokeImage').on('animationiteration', function () {
		if(stopShaking)
		{
			var $this = $(this);
			$this.removeClass('shaker');
			$this.addClass('shakers');
			$("#savingDisplay").fadeOut(1000);
			$("#pokeStars").show();
			$("#saveText").text("Done.");
			//$this.off();
		}
	});
});
$(document).on('click', '.copiable', function () {
	text = event.target.getAttribute("data-text");
	copyTextToClipboard(text);
	$('#toastText').text("Copied \""+text+"\" to clipboard");
	new bootstrap.Toast($('#liveToast')).show();
});
var config;
var selectedModel;
var selectedMake;
var appleWarningEnabled;
var appleCareRequiresFee;
var appleFindMyWarning;
function setupMakes()
{
	$("#makeSelector").empty();
	for (var brand in config.repairables) 
	{
		if(brand=="apple")
		{
			appleWarningEnabled = config.repairables[brand].warningOnAppleDevices==true;
			appleCareRequiresFee = config.repairables[brand].appleCareRequiresFee==true;
			appleFindMyWarning = config.repairables[brand].findMyWarning==true;
		}
		//<button id="makeOther" type="button" class="btn btn-outline-primary" onclick="makeSelect('Other')">Other</button>
		brandCommonName = config.repairables[brand].commonName;
		$("#makeSelector").append(
			"<button id=\"make"+brandCommonName+"\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"makeSelect('"+brandCommonName+"')\">"+brandCommonName+"</button>"
		);
	}
	$("#makeSelector").append(
		"<button id=\"makeOther\" type=\"button\" class=\"btn btn-outline-danger\" onclick=\"makeSelect('Other')\">Other</button>"
	);
}
function setupWarranties()
{
	$("#warrantySelector").empty();
	$("#warrantySelector").append(
		"<option value=\"\" selected></option>"
	);
	for(var i = 0; i < config.warranties.length; i++)
	{
		var warranty = config.warranties[i];
		$("#warrantySelector").append(
			"<option value=\""+warranty+"\">"+warranty+"</option>"
		);
	}
	$("#warrantySelector").append(
		"<option value=\"Other\">Other</option>"
	);
}
function getPill(innerName, name, id, functionSelect)
{
	var styling = 'background-color: '+config.employees[name].color+'; '+'border-color: '+config.employees[name].color+';';
	if(functionSelect=="")
	{
		styling +=" cursor: initial;"
	}
	var classes;
	if(config.employees[name]["black-text"])
	{
		classes = 'badge rounded-pill badge-spaced text-dark';
		//$("#printingPill").addClass("text-dark");
	}
	else
	{
		classes = 'badge rounded-pill badge-spaced';
		//$("#printingPill").removeClass("text-dark");
	}
	return "<span id=\""+id+"\" employee=\""+name+"\" style=\""+styling+"\" class=\""+classes+"\" onclick=\""+functionSelect+"\">"+innerName+"</span>";
}
function getOutlinedPill(name, id, functionSelect)
{
	var styling = "border-color: "+config.employees[name].color;
	if(functionSelect=="")
	{
		styling +=" cursor: initial;"
	}
	var classes = 'badge rounded-pill badge-not-selected text-dark';
	return "<span id=\""+id+"\" employee=\""+name+"\" style=\""+styling+"\" class=\""+classes+"\" onclick=\""+functionSelect+"\">"+config.employees[name]["name"]+"</span>";
}
function loadConfiguration()
{
	// Called when message received from main process
	window.api.receive("fromMainConfig", (data) => {
		try
		{
			config = JSON.parse(data);
			if(!config["searchRequiresSubmit"])
			{
				$("#searchButton").remove();
				$("#searchInput").attr("oninput", "search()");
				//$("#searchInput").css("height: 38px; width:100%");
				//$("#searchInputGroup").removeClass("input-group");
			}
			//<span id="selectEmployeeTodd" class="badge rounded-pill badge-not-selected text-dark badge-spaced" onclick="selectPill('Todd')">Todd</span>
			var building = "<div class=\"overflow-auto insideSaveAs\">";
			var buildingLogin = "<h5>";
			for (var employee in config.employees) 
			{
				if(!config.employees[employee].active)//skip if not active
				{
					continue;
				}
				$(".workerSelect").append(
					getOutlinedPill(employee, "selectEmployee"+employee, "selectPill('"+employee+"')")
				);
				if(config.employees[employee].repairTeam)
				{
					/*var pillStyle = 'background-color: '+config.employees[employee].color+'; '+'border-color: '+config.employees[employee].color+';';
					var pillClasses = '';
					if(config.employees[employee]["black-text"])
					{
						pillClasses = 'badge rounded-pill badge-spaced text-dark';
					}
					else
					{
						pillClasses = 'badge rounded-pill badge-spaced';
					}
					building += "<span id=\"repairEmployee"+employee+"\" class=\""+pillClasses+"\" onclick=\"selectRepairPill('"+employee+"')\" style=\""+pillStyle+"\">"+employee+"</span>"*/
					building += getPill(config.employees[employee]["name"], employee, "repairEmployee"+employee, "selectRepairPill('"+employee+"')");;
					buildingLogin += getPill(config.employees[employee]["name"], employee, "repairEmployeeLogin"+employee, "selectLoginPill('"+employee+"')");;
				}
			}
			building += "</div>";
			buildingLogin += "</h5>";
			$('#saveWorkAsButton').attr("data-bs-content", building);
			$("#toastTextLogin").append(buildingLogin);
			//setupMakes(); called with resetRepairForm
			//setupWarranties(); called like above
			$("#dropOffStatement").text(config.dropOffStatement);	
			$("#pickUpStatement").text(config.pickUpStatement);	
			$("#tooManyResultsWarning").text("There are more than "+config["maxRowsAtOnce"]+" results for your search, please refine your parameters");
			//console.log(config);
		}
		catch(e)
		{
			console.log(e);
			$("#mainError").show();
			$("#container").hide();
			$("#mainError").text("There is an error with configuration.json, can't load");
			//console.log("it seems like there is a problem with the json");
		}
		//console.log('Received ${'+data+'} from main process');
	});

	// Send a message to the main process
	window.api.send("toMain", "configPls");
}
window.api.receive("fromMainWaiting", (data) => {
	$("#savingDisplay").css("color", "red");
});
var collectKeyboard = false;
function startCollectKeyboard()
{
	collectKeyboard = true;
	//console.log(collectKeyboard);
}
function stopCollectKeyboard()
{
	collectKeyboard = false;
	//console.log(collectKeyboard);
}
function changeEmployee()
{
	//var elementEl = $("#saveAsButton");;
	//var tooltip = new bootstrap.Tooltip(elementEl);
}
/*function backToTable()
{
	$( "#mainTable" ).show();
	$( "#repairForm" ).hide();
	$( "#repairEdit" ).hide();
}*/
function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }
  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    //console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    //console.error('Async: Could not copy text: ', err);
  });
}
function removeTransision()
{
	$("#RepaPart").css("color", oldColor);
	$("#RepaPartTop").removeClass("RepaPartTrans");
	timer = 0;
}
var oldColor = "#000000";
var timer = 0;
function setRepaColor(newColor)
{
	//$("#RepaPartTop").removeClass("RepaPartTrans");
	//$("#RepaPart").css("background", "linear-gradient(to right, "+oldColor+", "+oldColor+" 50%, "+newColor+" 50%);");
	//$("#RepaPart").css("background-position", "100%");
	$("#RepaPartTop").css("color", newColor);
	$("#RepaPartTop").addClass("RepaPartTrans");
	oldColor = newColor;
	if(timer!=0)
	{
		clearTimeout(timer);
	}
	timer = setTimeout(removeTransision, 500);
	//$("#RepaPart").css("color", newColor);
}
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
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
function generateRandomRepair(refNum)
{
	var json = {};
	json["refNum"] = refNum;
	json["name"] = "name"+makeid(10);
	json["serial"] = "serial"+makeid(10);
	json["email"] = "email"+makeid(10)+"@osu.edu";
	json["startDate"] = new Date().toJSON();
	json["acc"] = "acc"+makeid(10);
	json["intakeNotes"] = "notes"+makeid(10);
	json["phone"] = "phone"+makeid(3)+"-"+makeid(3)+"-"+makeid(4);
	json["purchaseDate"] = "purch"+makeid(3);
	//json["lastTouched"] = new Date().toJSON();
	var problem = "prob"+makeid(10);
	var warranty = "warr"+makeid(10);
	json["make"] = "Apple";
	json["model"] = "iPad Something";
	json["status"] = "Created Repair Form";
	var date = new Date();
	json["logs"] = [{"who": "fojtik.6", "what": "Created the repair", "when": date.toJSON()}];
	//date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	json["workCompleted"] = [{"who": "fojtik.6", "when": date.toJSON(), "what": "Created Repair Form", "note": ""}];
	json["descriptors"] = makeDescriptors(json);
	//json["archived"] = false;
	return json;
}
function generateLots(amount)
{
	var repairs = {};
	for(var i = 0; i < amount; i++)
	{
		repairs[(i+1)+""] = generateRandomRepair(i+1);
	}
	console.log(JSON.stringify(repairs));
}