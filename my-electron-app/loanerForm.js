function resetLoanerForm()
{

}
function saveAndPrintLoaner()
{

}
function saveLoaner()
{

}
function backToRepair()
{

}
var selectedEmployee;
function selectLoanerPill(name)//pass null if you want to reset pills
{
	selectedEmployee = name;
	var allPills = $("#loanerWorkerSelector").children();
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
