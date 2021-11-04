//useful links
//guess at safeware or fortegra
function keyDownHandler(event)
{
	if(event.key=='Escape')
	{
		backToTable();
	}
	//console.log(event);
}
$( document ).ready(function() {
	$( "#searchInput" ).select();
	document.addEventListener('keydown', keyDownHandler);
	var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
	var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
	  return new bootstrap.Popover(popoverTriggerEl)
	});
});
$(document).on('click', '.copiable', function () {
	text = event.target.getAttribute("data-text");
	copyTextToClipboard(text);
	$('#toastText').text("Copied \""+text+"\" to clipboard");
	new bootstrap.Toast($('#liveToast')).show();
});
function findPerson()
{
	//alert('hi');
	/*var xhr = new XMLHttpRequest();
	xhr.open("POST", yourUrl, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
		value: value
	}));*/
}
function closeSaveAsPopover()
{
	var popover = bootstrap.Popover.getInstance($('#saveAsButton'));
	if(popover)
	{
		popover.hide();
	}
}
var darkTexts = ['Chloe', 'Brennan', 'Dave'];
function markSelectedPill(thePill, theName)
{
	if(darkTexts.indexOf(theName)!=-1)
	{
		thePill.className = 'badge rounded-pill badge-'+theName+' badge-spaced text-dark';
	}
	else
	{
		thePill.className = 'badge rounded-pill badge-'+theName+' badge-spaced';
	}
}
function markDeselectedPill(thePill, theName)
{
	thePill.className = 'badge rounded-pill badge-'+theName+'-ns badge-not-selected text-dark badge-spaced';
}
function makeSelect(name)
{
	var allMakes = $("#makeSelector").children();
	var theMake;
	for(var i = 0; i < allMakes.length; i++)
	{
		var theName = allMakes[i].innerHTML;
		allMakes[i].className = 'btn btn-outline-primary';
		if(theName==name)
		{
			theMake = allMakes[i];
		}
	}
	if(theMake.innerHTML=='Other')
	{
		$("#makeOtherBox").show();
	}
	else
	{
		$("#makeOtherBox").hide();
	}
	theMake.className = 'btn btn-primary';
}
function typeSelect(id)
{
	var allTypes = $("#typeSelectors").find('button');
	var theType;
	for(var i = 0; i < allTypes.length; i++)
	{
		var theName = allTypes[i].id;
		allTypes[i].className = 'btn btn-outline-primary';
		if(theName==id)
		{
			theType = allTypes[i];
		}
	}
	if(theType.innerHTML=='Other')
	{
		$("#typeOtherBox").show();
	}
	else
	{
		$("#typeOtherBox").hide();
	}
	theType.className = 'btn btn-primary';
}
function selectPill(name)
{
	var allPills = $(".workerSelect").children();
	var thePill;
	for(var i = 0; i < allPills.length; i++)
	{
		var theName = allPills[i].innerHTML;
		markDeselectedPill(allPills[i], theName);
		if(theName==name)
		{
			thePill = allPills[i];
		}
	}
	markSelectedPill(thePill, name);
}
function changeEmployee()
{
	//var elementEl = $("#saveAsButton");;
	//var tooltip = new bootstrap.Tooltip(elementEl);

}
function clickRow(rowNumber)
{
	$( "#repairForm" ).show();
	$( "#mainTable" ).hide();
}
function backToTable()
{
	$( "#mainTable" ).show();
	$( "#repairForm" ).hide();
}
function addWork()
{
	new bootstrap.Toast($('#addWorkToast')).show();
}
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