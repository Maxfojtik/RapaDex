$( document ).ready(function() {
	loadAll();
})
$(document).on("keyup", '#searchInput', function(e) {
	if (e.keyCode == 13 && !freezeFront) {
		search(true);
	}
});
var refClicked = 0;
var backendData;
var freezeFront = false;
function clickRow(number)
{
	//console.log("row: "+number);
	if(refClicked==number && !freezeFront)
	{	
		refClicked = 0;
		showRepair(backendData["repairs"], number);//show the repair and start a new request for data (for updated info)
		startUpdate(number);
		$("#mainTable").hide();
		$("#repairContextButtons").hide();
		$("#repairEdit").fadeIn();
		shownPanel = 1;
	}
	else
	{
		refClicked = number;
	}
}
function getTopRepair(repairs)
{
	var topNumber = 0;
	for(var refNum in repairs)
	{
		//console.log(refNum+":"+topNumber);
		if(parseInt(refNum) > topNumber)
		{
			topNumber = refNum;
		}
	}
	return topNumber;
}
function getBottomRepair(repairs)
{
	var bottomNumber = 0;
	for(var refNum in repairs)
	{
		//console.log(refNum+":"+topNumber);
		if(parseInt(refNum) < bottomNumber)
		{
			bottomNumber = refNum;
		}
	}
	return bottomNumber;
}
window.api.receive("fromMainLoadAll", (data) => 
{
	doneLoadingSaving();
	try
	{
		backendData = JSON.parse(data);
		/*for(var refNum in backendData["repairs"])
		{
			backendData["repairs"][refNum]["descriptors"] = makeDescriptors(backendData["repairs"][refNum]);
			window.api.send("toMain", "s"+JSON.stringify(backendData["repairs"][refNum]));
		}*/
		if(backendData["repairs"])
		{
			showRepairs(backendData["repairs"], 100);
		}
	}
	catch(e)
	{
		console.log(e);
		$("#mainError").show();
		$("#container").hide();
		$("#mainError").text("There is an error with the backend json file, can't load ("+e+")");
	}
	freezeFront = false;
	$("#startNewRepairButton").prop('disabled', false);
	$("#searchButton").prop('disabled', false);
	$("#refreshButton").prop('disabled', false);
	$("#filterButton").prop('disabled', false);
	$(".front-row").css("cursor", "pointer");
	//console.log('Received ${'+data+'} from main process');
});
function loadAll()
{
	freezeFront = true;
	topRepair = undefined;
	$("#dtBody").empty();
	$(".front-row").css("cursor", "default");
	$("#searchButton").prop('disabled', true);
	$("#refreshButton").prop('disabled', true);
	$("#filterButton").prop('disabled', true);
	$("#startNewRepairButton").prop('disabled', true);
	$("#saveSpinner").css("visibility", "hidden");
	$("#searchInput").val("");
	startLoadingSaving("Loading repairs...");
	window.api.send("toMain", "loadAll");
}	
function createNewRepair()
{
	$("#mainTable").hide();
	$("#repairForm").fadeIn();
	logOut();
	resetRepairForm();
	resetVersionStyling();
	shownPanel = 2;
}
var repairsToReDraw;
var lengthOfReDraw;
var simple = true;
function reDraw()
{
	if(simple)
	{
		showRepairs(repairsToReDraw, lengthOfReDraw);
	}
	else
	{
		showSimilarRepairs(repairsToReDraw, lengthOfReDraw);
	}
}
function showRepairs(repairsIn, length)
{
	// console.log(start+":"+Object.keys(repairsIn).length+":"+length);
	simple = true;
	repairsToReDraw = repairsIn;
	lengthOfReDraw = length;
	$("#dtBody").empty();
	if(repairsIn.length == 0)
	{
		topRepair = undefined;
	}
	else
	{
		var counter = 0;
		var bottomRepair = getBottomRepair(repairsIn);
		for(var i = getTopRepair(repairsIn); i >= bottomRepair; i--)
		{
			var refNum = i;
			if(counter>length)
			{
				continue;
			}
			var repair = repairsIn[refNum];
			if(!repair)//if the repair does not exist skip
			{
				continue;
			}
			console.log(refNum);
			var thisStatus = repair.status;
			if(thisStatus.includes("Picked up"))
			{
				thisStatus = "Picked Up";
			}
			if(hiddenStatuses[thisStatus])
			{
				continue;
			}
			console.log(counter+":"+length);
			counter++;
			/*if(repairsIn[refNum]["archived"] && !showArchived)
			{
				console.log("archived; skipping");
				continue;
			}*/
			//repair["descriptors"] = makeDescriptors(repair);
			//console.log(repair["descriptors"]);
			var row = "<tr class=\""+repair.color+" front-row\" onclick=\"clickRow("+repair.refNum+")\"><th scope=\"row\">"+repair.name+"</th>";
			row += "<td>"+repair.refNum+"</td>";
			row += "<td>"+repair.make+" "+repair.model+"</td>";
			row += "<td>"+repair.serial+"</td>";
			var date = new Date(repair.startDate);
			var dateText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
			row += "<td>"+dateText+"</td>";
			row += "<td>"+repair.status+"</td>";
			$("#dtBody").append(row);
			topRepair = repair;
		}
	}
}
function generateSerialHTML(og, subsitutions)
{
	var toReturn = "";
	//console.log(subsitutions);
	for(var i = 0; i < og.length; i++)
	{
		console.log(subsitutions[i]);
		if(subsitutions[i] != null)
		{
			toReturn += "<span style='color: #ff0000'>"+subsitutions[i]+"</span>";
		}
		else
		{
			toReturn += og[i];
		}
	}
	return toReturn;
}
function showSimilarRepairs(caughtRepairsAndSubstitutions, start, length)
{
	simple = false;
	repairsToReDraw = caughtRepairsAndSubstitutions;
	startOfReDraw = start;
	lengthOfReDraw = length;
	$("#dtBody").empty();
	topRepair = undefined;//remove a top repair because we dont want enter to work
	var counter = 0;
	var bottomRepair = getBottomRepair(caughtRepairsAndSubstitutions["caughtRepairs"]);
	for(var i = getTopRepair(caughtRepairsAndSubstitutions["caughtRepairs"]); i >= bottomRepair; i--)
	{
		if(counter>length)
		{
			continue;
		}
		var repair = caughtRepairsAndSubstitutions["caughtRepairs"][i];
		var thisStatus = repair.status;
		if(thisStatus.includes("Picked up"))
		{
			thisStatus = "Picked Up";
		}
		if(hiddenStatuses[thisStatus])
		{
			continue;
		}
		counter++;
		var row = "<tr class=\""+repair.color+" front-row\" onclick=\"clickRow("+repair.refNum+")\"><th scope=\"row\">"+repair.name+"</th>";
		row += "<td>"+repair.refNum+"</td>";
		row += "<td>"+repair.make+" "+repair.model+"</td>";
		row += "<td>"+generateSerialHTML(repair.serial, caughtRepairsAndSubstitutions["substitutions"][i])+"</td>";
		var date = new Date(repair.startDate);
		var dateText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
		row += "<td>"+dateText+"</td>";
		row += "<td>"+repair.status+"</td>";
		$("#dtBody").prepend(row);
	}
}
var lastSearchFor = "";
var topRepair = undefined;
function catchRepairs(toSearchFor, variance)
{
	var caughtRepairs = [];
	for(var refNum in backendData["repairs"])
	{
		if(backendData["repairs"][refNum]["archived"])
		{
			continue;
		}
		var descriptors = backendData["repairs"][refNum]["descriptors"];
		//console.log(descriptors);
		for(var i in descriptors)
		{
			if(includes(descriptors[i], toSearchFor, variance))
			{
				caughtRepairs.push(backendData["repairs"][refNum]);
				//console.log(backendData["repairs"][refNum]+"  "+descriptors[i]);
				break;
			}
		}
	}
	return caughtRepairs;
}
function catchSerialNumbersIncludingDifferences(toSearchFor, variance, maxHits)
{
	toSearchFor = toSearchFor.toUpperCase();
	var caughtRepairs = [];
	var substitutions = [];
	var hits = 0;
	for(var refNum in backendData["repairs"])
	{
		if(backendData["repairs"][refNum]["archived"])
		{
			continue;
		}
		var serial = backendData["repairs"][refNum]["serial"].toUpperCase();
		//console.log(serial);
		var wordSubstitutions = includesCalculatingDifferences(serial, toSearchFor, variance);
		//console.log(serial+"\t"+wordSubstitutions);
		if(wordSubstitutions!=undefined)
		{
			caughtRepairs.push(backendData["repairs"][refNum]);
			substitutions.push(wordSubstitutions);
			hits++;
			if(hits>=maxHits)
			{
				break;
			}
			//console.log(backendData["repairs"][refNum]+"  "+descriptors[i]);
		}
		
	}
	return {"caughtRepairs": caughtRepairs, "substitutions": substitutions};
}
function includes(whole, part, variance)
{
	const wArray = Array.from(whole);
	const pArray = Array.from(part);
	for(var i = 0; i < wArray.length; i++)
	{
		var errors = 0;
		var errored = false;
		for(var k = 0; k < pArray.length; k++)
		{
			if((i+k)>=wArray.legnth)
			{
				errored = true;
				break;
			}
			if(wArray[i+k] != pArray[k])
			{
				errors++;
			}
			if(errors>variance)
			{
				errored = true;
				break;
			}
		}
		if(!errored)
		{
			return true;
		}
	}
	return false;
}
function includesCalculatingDifferences(whole, part, variance)
{
	const wArray = Array.from(whole);
	const pArray = Array.from(part);
	for(var i = 0; i < wArray.length; i++)
	{
		var errors = 0;
		var errored = false;
		var substitutions = [];
		substitutions.length = wArray.length;
		for(var k = 0; k < pArray.length; k++)
		{
			if((i+k)>=wArray.legnth)
			{
				errored = true;
				break;
			}
			if(wArray[i+k] != pArray[k])
			{
				substitutions[i+k] = wArray[i+k];
				errors++;
			}
			if(errors>variance)
			{
				errored = true;
				break;
			}
		}
		if(!errored)
		{
			return substitutions;
		}
	}
	return undefined;
}
function putRepairIfNotThere(caughtRepairsAndSubstitutions, newCaughtRepairsAndSubstitutions)
{
	for(var i = 0; i < newCaughtRepairsAndSubstitutions["caughtRepairs"].length; i++)
	{
		var inArray = false;
		for(var k = 0; k < caughtRepairsAndSubstitutions["caughtRepairs"].length; k++)
		{
			if(caughtRepairsAndSubstitutions["caughtRepairs"][k]["serial"] == newCaughtRepairsAndSubstitutions["caughtRepairs"][i]["serial"])
			{
				inArray = true;
			}
		}
		if(!inArray)
		{
			caughtRepairsAndSubstitutions["caughtRepairs"].push(newCaughtRepairsAndSubstitutions["caughtRepairs"][i]);
			caughtRepairsAndSubstitutions["substitutions"].push(newCaughtRepairsAndSubstitutions["substitutions"][i]);
		}
	}
}
function search(wasEnter)
{
	$("#saveSpinner").css("visibility", "visible");
	var caughtRepairs = [];
	var toSearchFor = $("#searchInput").val().toLowerCase();
	if(lastSearchFor == toSearchFor && lastSearchFor!="" && topRepair!=undefined && wasEnter)//second search
	{
		lastSearchFor = "";
		refClicked = topRepair.refNum;
		clickRow(refClicked);
	}
	//console.log("Searching For '"+toSearchFor+"'");
	if(toSearchFor=="")
	{
		showRepairs(backendData["repairs"], 100);
		$("#tooManyResultsWarning").fadeOut();
		$("#similarResultsWarning").fadeOut();
	}
	else
	{
		caughtRepairs = catchRepairs(toSearchFor, 0);//first try with 0 variance
		var tooMany = false;
		if(caughtRepairs.length == 0)//could not find the repair, search again but add some variance
		{
			var variance = 0;
			var caughtRepairsAndSubstitutions = {"caughtRepairs": [], "substitutions": []};
			while(caughtRepairsAndSubstitutions["caughtRepairs"].length < 100 && variance <= 3)//while we have less than 10 results, keep searching and adding more variance until we reach 3, then we are SOL
			{
				putRepairIfNotThere(caughtRepairsAndSubstitutions, catchSerialNumbersIncludingDifferences(toSearchFor, variance, 100));
				//console.log(caughtRepairsAndSubstitutions["caughtRepairs"].length);
				variance++;
			}
			var maxRepairs = Object.keys(caughtRepairsAndSubstitutions["caughtRepairs"]).length;
			if(maxRepairs>config["maxRowsAtOnce"])
			{
				//tooMany = true;
				maxRepairs = config["maxRowsAtOnce"];
			}
			showSimilarRepairs(caughtRepairsAndSubstitutions, 0, maxRepairs);
			$("#similarResultsWarning").fadeIn();
		}
		else
		{
			var maxRepairs = Object.keys(caughtRepairs).length;
			if(maxRepairs>config["maxRowsAtOnce"])
			{
				tooMany = true;
				maxRepairs = config["maxRowsAtOnce"];
			}
			showRepairs(caughtRepairs, maxRepairs);//use the normal function when showing with no variance
			$("#similarResultsWarning").fadeOut();
		}
		if(tooMany)
		{
			$("#tooManyResultsWarning").fadeIn();
		}
		else
		{
			$("#tooManyResultsWarning").fadeOut();
		}
	}
	lastSearchFor = toSearchFor;
	//console.log(caughtRepairs);
	$("#saveSpinner").css("visibility", "hidden");
}
var possibleStatuses = ["Created Repair Form", "Diagnosed", "Submitted Claim", "Submitted RFA", "Sent Out", "Ordered Parts", "Parts Arrived", "Waiting on DEP", "Finished", "Picked Up"];
var idToStatus = {};
var hiddenStatuses = {};
var filterPopover;

function initFilterPopover()
{
	var body = "";
	for(var i in possibleStatuses)
	{
		var checkID = possibleStatuses[i].replace(/\s/g, "").toLowerCase()+"filteroption";
		idToStatus[checkID] = possibleStatuses[i];
		var rawHTML = "<div class='form-check'><input class='form-check-input' type='checkbox' value='' id='"+checkID+"' checked><label class='form-check-label' for='flexCheckDefault'>"+possibleStatuses[i]+"</label></div>";
		console.log(rawHTML);
		body += rawHTML;
	}
	var exampleEl = document.getElementById('filterButton');
	var options = {"content": body, "html": true, "sanitize": false};
	filterPopover = new bootstrap.Popover(exampleEl, options);
}
function openFilter()
{	
	filterPopover.toggle();
	for(var i in possibleStatuses)//add jQuery to the stuffs
	{
		var checkID = possibleStatuses[i].replace(/\s/g, "").toLowerCase()+"filteroption";
		$("#"+checkID).off('change');//remove all current change listeners
		$("#"+checkID).on("change", function() {
			hiddenStatuses[idToStatus[this.id]] = !this.checked;
			reDraw();
		});
	}
}
// function filterTable()
// {
// 	$('#dtBody').children().each(function(i, ele) 
// 	{
// 		console.log(ele);
// 		var thisStatus = $(ele).find('.rowStatusLabel').text();
// 		if(thisStatus.includes("Picked up"))
// 		{
// 			thisStatus = "Picked Up";
// 		}
// 		if(hiddenStatuses[thisStatus])
// 		{
// 			$(ele).hide();
// 		}
// 		else
// 		{
// 			$(ele).show();
// 		}
// 	});
// }