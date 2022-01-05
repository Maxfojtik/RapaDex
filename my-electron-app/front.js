$( document ).ready(function() {
	loadAll();
})
$(document).on("keyup", '#searchInput', function(e) {
	if (e.keyCode == 13 && !freezeFront) {
		search();
	}
});
var refClicked = 0;
var backendData;
var freezeFront = false;
function clickRow(number)
{
	console.log("row: "+number);
	if(refClicked==number && !freezeFront)
	{	
		refClicked = 0;
		showRepair(backendData["repairs"], number);//show the repair and start a new request for data (for updated info)
		startUpdate(number);
		$("#mainTable").hide();
		$("#repairContextButtons").hide();
		$("#repairEdit").show();
	}
	else
	{
		refClicked = number;
	}
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
			showRepairs(backendData["repairs"], true, Object.keys(backendData["repairs"]).length-100, 100);
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
	$(".front-row").css("cursor", "pointer");
	//console.log('Received ${'+data+'} from main process');
});
function loadAll()
{
	freezeFront = true;
	$("#dtBody").empty();
	$(".front-row").css("cursor", "default");
	$("#searchButton").prop('disabled', true);
	$("#refreshButton").prop('disabled', true);
	$("#startNewRepairButton").prop('disabled', true);
	$("#saveSpinner").css("visibility", "hidden");
	$("#searchInput").val("");
	startLoadingSaving("Loading repairs...");
	window.api.send("toMain", "loadAll");
}	
function createNewRepair()
{
	$("#mainTable").hide();
	$("#repairForm").show();
	logOut();
	resetRepairForm();
}
function showRepairs(repairsIn, showArchived, start, length)
{
	$("#dtBody").empty();
	var counter = 0;
	for(var refNum in repairsIn)
	{
		if(refNum<start || counter>length)
		{
			continue;
		}
		counter++;
		var repair = repairsIn[refNum];
		/*if(repairsIn[refNum]["archived"] && !showArchived)
		{
			console.log("archived; skipping");
			continue;
		}*/
		//repair["descriptors"] = makeDescriptors(repair);
		//console.log(repair["descriptors"]);
		var row = "<tr class=\"table-"+repair.color+" front-row\" onclick=\"clickRow("+repair.refNum+")\"><th scope=\"row\">"+repair.name+"</th>";
		row += "<td>"+repair.refNum+"</td>";
		row += "<td>"+repair.make+" "+repair.model+"</td>";
		row += "<td>"+repair.serial+"</td>";
		var date = new Date(repair.startDate);
		var dateText = String(date.getMonth()+1).padStart(2, '0')+"/"+String(date.getDate()).padStart(2, '0')+"/"+date.getFullYear();
		row += "<td>"+dateText+"</td>";
		row += "<td>"+repair.status+"</td>";
		$("#dtBody").prepend(row);
	}
}
function search()
{
	$("#saveSpinner").css("visibility", "visible");
	var caughtRepairs = [];
	var toSearchFor = $("#searchInput").val().toLowerCase();
	//console.log("Searching For '"+toSearchFor+"'");
	if(toSearchFor=="")
	{
		showRepairs(backendData["repairs"], true, Object.keys(backendData["repairs"]).length-100, 100);
		$("#tooManyResultsWarning").fadeOut();
	}
	else
	{
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
				if(descriptors[i].includes(toSearchFor))
				{
					caughtRepairs.push(backendData["repairs"][refNum]);
					//console.log(backendData["repairs"][refNum]+"  "+descriptors[i]);
					break;
				}
			}
		}
		var maxRepairs = Object.keys(caughtRepairs).length;
		var tooMany = false;
		if(maxRepairs>config["maxRowsAtOnce"])
		{
			tooMany = true;
			maxRepairs = config["maxRowsAtOnce"];
		}
		showRepairs(caughtRepairs, true, 0, maxRepairs);
		if(tooMany)
		{
			$("#tooManyResultsWarning").fadeIn();
		}
		else
		{
			$("#tooManyResultsWarning").fadeOut();
		}
	}
	//console.log(caughtRepairs);
	$("#saveSpinner").css("visibility", "hidden");
}