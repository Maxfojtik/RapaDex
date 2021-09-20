//useful links
//guess at safeware or fortegra

$( document ).ready(function() {
  $( "#searchInput" ).select();
});
$(document).on('click', '.copiable', function () {
	text = event.target.getAttribute("data-text");
	copyTextToClipboard(text);
	new bootstrap.Toast($('#liveToast')).show();
	$('#toastText').text("Copied \""+text+"\" to clipboard");
});

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