// This is complicated but I'll try to comment it out so you know what's going on!

// ************************************************
// Section ONE: see if a sliding scale payment applies
// ************************************************

function stepOne(income){
	// The following ranges are estimates based on a few sliding scales available online,
	// and my own therapist's sliding scale
	if (income > 90000 ){
		var baserate = 125;
	}
	else {
		$('#sliding-scale-div').html("<h2>You may qualify for a discount!</h2><p>It may be worth it to seek out a therapist who offers sliding-scale fees.</p>");
	}
	if (income > 90000 ){
	}
	else if (income > 74999){
		var baserate = 100;
	}
	else if (income > 49999){
		var baserate = 80;
	}
	else if (income > 29000){
		var baserate = 60;
	}
	else if (income < 29001){
		var baserate = (income/1000*2);
		baserate = Math.round(baserate);
	}
	if (baserate < 20){
		var baserate = 20; // set 20 as the lower limit; you probably won't pay less than that
	}
	setBaseRate(baserate);

	// Move on to the next section
	var location = "#section-2";
	scrollTo(location);

	// Initialize the baserate slider in section two
	var $slider = new Foundation.Slider($('.slider'), {
	  initialStart : baserate,
	  start: 20,
	  end: 150,
	  step: 5,
	});
}


// ************************************************
// Section TWO: Set a basic per-session rate based on their income
// ************************************************

function setBaseRate(baserate){
	$('#baserate-span').html(baserate);
	window.globalSessionRate = baserate; // we're going to push variables we'll need later to the DOM
	window.globalYearlyCost = (baserate * globalNumberOfSessions);
	$('#yearly-cost-span').html(globalYearlyCost); // Extrapolate a yearly cost
}


// ************************************************
// Section THREE: Which insurance section should we take them to?
// ************************************************

// Show and hide additional insurance options based on their coverage status
$("#covered-or-not").on('change', function(){
	var coveredYesNo = $('#covered-or-not :selected').val();
    if (coveredYesNo == "not-covered") {
    	$("#network-or-not-label").slideUp();
    }
	else {
		$("#network-or-not-label").slideDown();
	}
});

function checkInsurance(coveredYesNo, networkYesNo){
	if (coveredYesNo == "covered"){
		// If they're staying in the provider network (or don't have to worry about one)...
		if (networkYesNo == "in-network" || networkYesNo == "no-network"){
			var location = "#section-4";
		}
		else {
			var location = "#section-5"; // if they're not staying in-network
		}
	}
	else {
		var location = "#section-6"; // if they're not covered at all
	}
	scrollTo(location); // Send me to the section they selected
}


// ************************************************
// Section FOUR: Calculate their in-network benefits
// ************************************************

function applyNetworkInsurance(copay,deductible){
	if (globalYearlyCost > deductible){ // If their deductible isn't too high...
		var sessionsToHitDeductible = (deductible/globalSessionRate); // how many sessions to hit their deductible?
		sessionsToHitDeductible = Math.ceil(sessionsToHitDeductible); // we want the upper limit of the session it takes
		var sessionsRemaining = (globalNumberOfSessions - sessionsToHitDeductible);
		sessionsRemaining = Math.round(sessionsRemaining);
		yearlyCostWithInsurance = ((sessionsRemaining * copay) + deductible);
		window.globalInsuranceDiscount = (globalYearlyCost - yearlyCostWithInsurance);
		setInsurance(yearlyCostWithInsurance);
		// Insurance helped, so let's show the paragraph that says so, and a corresponding heading
		$('#insurance-results').show();
		$('#section-6 h2').html("Making progress!");
	}
	else {
		// The deductible on this insurance is too high to help
		// That sucks; let's be sympathetic
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p>You didn’t save any money this way. It may be worth it for you to consider paying slightly more per month for insurance with a lower deductible.</p>");
	}
	var location = "#section-6";
	scrollTo(location);  // Moving on!
}


// ************************************************
// Section FIVE: Calculate their out-of-netork insurance benefits
// ************************************************

/* This function is a little crazy, bear with me */
function applyInsurance(deductible,coinsurance,outofnetworkCopay,approvedAmount){
	if (globalYearlyCost > deductible){  // First, let's check to see if their deductible is so high that nothing matters ALREADY
		// If it's not, let's set a variable specifically for this function
		var yearlyCostForThisFunction = globalYearlyCost;
		// The first thing we want to know is whether a cap will affect their per-session rate
		if(approvedAmount < globalSessionRate) { // If yes...
			// Their insurance only thinks it has to pay this much each year
			yearlyCostForThisFunction = (approvedAmount * globalNumberOfSessions);
		}
		var costOfCopays = (outofnetworkCopay * globalNumberOfSessions); // how much copay cost of the course of a year
		var yearlyCostAfterDeductions = (yearlyCostForThisFunction - deductible - costOfCopays); // removing whatever insurance won't cover ...
		var insuranceDiscount = yearlyCostAfterDeductions*((100-coinsurance)/100); // ...and applying the deductible to the rest. This is how much cash you save.
		window.globalInsuranceDiscount = insuranceDiscount; // send it to the DOM
		var yearlyCostWithInsurance = (globalYearlyCost - insuranceDiscount); // This is your yearly amount post-insurance savings
		setInsurance(yearlyCostWithInsurance);
	}
	else {
		// The deductible on this insurance is too high to help
		// That sucks; let's be sympathetic
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p class='border-bottom'>You didn’t save any money this way. It may be worth it to see if you can get a plan that costs a little more per month but has a lower deductible.</p>");
	}
	if (insuranceDiscount > 0) {
		// Insurance helped, so let's show the paragraph that says so, and a corresponding heading
		$('#insurance-results').show();
		$('#section-6 h2').html("Making progress!");
		// Send a tip to the final summary list
		$("#summary-tips-label").show();
		$("#summary-tips").append("<li>To use your insurance, you’ll need to save your receipts and submit insurance claims.</li>");
		$("#summary-tips").append("<li>I highly recommend taking pictures of your receipts and saving them in an album on your phone, or backing them up to a service like Dropbox or Google Photos.</li>");
		window.globalTrackingReceipts = "yes"; // For the tips section at the end, we need to know if this person is submitting receipts
	}
	else {
		// We tried really hard, but their insurance just had too many restrictions to be helpful
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p class='border-bottom'>You didn’t save any money this way. It may be worth it to see if you can get a plan that costs a little more per month but has fewer costs when you use it.</p>");
	}
	var location = "#section-6";
	scrollTo(location); // Moving on!
}


// ************************************************
// Section SIX: Reporting on the insurance results
// ************************************************

function setInsurance(yearlyCostWithInsurance){
	// Let's report how much insurance lowers their yearly cost and session rate:
	$('#insurance-yearly-span').html(yearlyCostWithInsurance);
	var sessionRateWithInsurance = (yearlyCostWithInsurance/globalNumberOfSessions);
	sessionRateWithInsurance = Math.round(sessionRateWithInsurance); // Round the session rate to a whole number
	sessionRateWithInsurance = parseInt(sessionRateWithInsurance);
	$('#insurance-baserate-span').html(sessionRateWithInsurance);
	window.globalSessionRate = sessionRateWithInsurance;
	window.globalYearlyCost = yearlyCostWithInsurance;
}


// ************************************************
// Section SEVEN and EIGHT: How much can they put in an FSA or HSA?
// ************************************************

function setFSA(){
	// Check to see if the yearly cost of therapy is less than the max allowed FSA contribution
	if (globalYearlyCost > 2600){
		$('#fsa-field').val(2600);
	}
	else {
		$('#fsa-field').val(globalYearlyCost);
	}
	var location = "#section-7";
	scrollTo(location); // Moving on!
}


function setHSA(){
	// Check to see if the yearly cost of therapy is less than the max allowed HSA contribution
	if (globalYearlyCost > 6750){ // This is a little simplistic -- I'm only checking the family max contribution
		$('#hsa-field').val(6750);
	}
	else {
		$('#hsa-field').val(globalYearlyCost);
	}
	var location = "#section-8";
	scrollTo(location);
}


// ************************************************
// Section NINE: Doing Yer Taxes and reporting the results
// ************************************************


// Let's figure out how much a tax deduction would save them */
// This function is used by FSA, HSA and Itemized Deductions

function doTaxes(contribution,fromWhere){
	// Apply some marginal tax rates, yo!
	if (globalIncome > 418400){
		var taxRate = .3960
		var baseTaxes = 121505.25;
		var amountOver = 418400;
	}
	else if (globalIncome > 416700){
		var taxRate = .35
		var baseTaxes = 120910.25;
		var amountOver = 416700;
	}
	else if (globalIncome > 191650){
		var taxRate = .33
		var baseTaxes = 46643.75;
		var amountOver = 191650;
	}
	else if (globalIncome > 91900){
		var taxRate = .28
		var baseTaxes = 18713.75;
		var amountOver = 91900;
	}
	else if (globalIncome > 37950){
		var taxRate = .25
		var baseTaxes = 5226.25;
		var amountOver = 37950;
	}
	else if (globalIncome > 9325){
		var taxRate = .15
		var baseTaxes = 932.50;
		var amountOver = 9325;
	}
	else if (globalIncome > 0){
		var taxRate = .10
		var baseTaxes = 0;
		var amountOver = 0;
	}

	// This is a little simplistic, but we're checking what they would pay in taxes normally...
	var taxesOwed = ((globalIncome - amountOver)*taxRate)+baseTaxes;

	// ...and then lowering their income by their pre-tax contribution amount, and checking again
	window.globalIncome = (globalIncome - contribution); // we'll need this later
	var taxesOwedWithContribution = ((globalIncome - amountOver)*taxRate)+baseTaxes;
	taxesOwedWithContribution = Math.round(taxesOwedWithContribution);
	var taxDiscount = taxesOwed-taxesOwedWithContribution;
	var yearlyCostWithContribution = (globalYearlyCost - taxDiscount);
	window.globalTaxDiscount = taxDiscount;
	globalYearlyCost = yearlyCostWithContribution;
	globalSessionRate = (globalYearlyCost/globalNumberOfSessions);
	globalSessionRate = Math.round(globalSessionRate); // Round the session rate to a whole number
	reportTaxes(fromWhere); // Depending on where they came from, report results as shown below
}

function reportTaxes(fromWhere){
	if (fromWhere == "itemized"){
		var location = "#section-10";
		$('#itemized-tax-discount-span').html(globalTaxDiscount);
		$('#section-10 .variable-content #itemized-tax-results').show();
		$("#summary-tips").append("<li>You asked to claim you medical expenses on your taxes, so you'll need to itemize your deductions.</li>");
	}
	else {
		if (fromWhere == "fsa"){
			$('#section-10 .variable-content #used-what').html(" by using your FSA");
			if (globalTrackingReceipts == "yes"){ // If this person is submitting manual claims, give these tips
				$("#summary-tips").append("<li>After your insurance claims are processed, you can pay for the remaining balance with your FSA. Yep, it's a two-step process. You can submit the Explanation of Benefits from your insurance claims once they’re complete, and copies of your original receipts.</li>");
			}
			else { // if not, give these ones
				$("#summary-tips").append("<li>To use your Flexible Spending Account, you’ll need to save your receipts and submit claims with your FSA.</li>");
				$("#summary-tips").append("<li>I highly recommend taking pictures of your receipts and saving them in an album on your phone, or backing them up to a service like Dropbox or Google Photos.</li>");
			}
		}
		else if (fromWhere == "hsa"){
			$('#section-10 .variable-content #used-what').html(" by using your HSA");
			if (globalTrackingReceipts == "yes"){ // If this person is submitting manual claims, give these tips
				$("#summary-tips").append("<li>After your insurance claims are processed, you can pay for the remaining balance with your HSA. Yep, it's a two-step process. You can submit the Explanation of Benefits from your insurance claims once they’re complete, and copies of your original receipts.</li>");
			}
			else { // if not, give these ones
				$("#summary-tips").append("<li>To use your Health Savings Account, you’ll need to save your receipts and submit claims with your HSA.</li>");
				$("#summary-tips").append("<li>I highly recommend taking pictures of your receipts and saving them in an album on your phone, or backing them up to a service like Dropbox or Google Photos.</li>");
			}
		}
		$('#tax-discount-span').html(globalTaxDiscount);
		var location = "#section-9";
		setTaxResults();
		checkItemized();
	}
	$("#summary-tips-label").show();
	scrollTo(location);
}

// Change the content of the tax results div based on their tax savings
function setTaxResults() {
	$('#section-9 .variable-content h2').html("<h2>Guess what?</h2>");
	$('#section-9 #additional-taxes').html("another"); // changing a word based on whether we have multiple tax tips
	$('#section-9 .variable-content #tax-results').show();
}

// Let's check what percentage of their yearly income is their therapy bills
function checkItemized(){
	var percentageOfIncome = globalYearlyCost/globalIncome*100;
	percentageOfIncome = percentageOfIncome.toFixed(2); // round to 2 decimal places
	$('#income-percentage').html(percentageOfIncome);
}


// ************************************************
// Section TEN: If itemized deductions are requested, go back through the tax loop above
// ************************************************

function getItemized() {
	var contribution = globalYearlyCost;
	var fromWhere = "itemized";
	doTaxes(contribution,fromWhere);
}


// ************************************************
// Section ELEVEN: We're done! Let's report our findings:
// ************************************************

function getSummary() {
	$('#final-session-rate').html(globalSessionRate);
	$('#final-yearly-cost').html(globalYearlyCost);
		if ((globalInsuranceDiscount>0) || (globalTaxDiscount>0)) {
		$('#but').show();
	}
	if (globalInsuranceDiscount>0) {
		$('#insurance-saved').show();
		$('#the-insurance-saved').html(globalInsuranceDiscount);
	}
	if (globalTaxDiscount>0) {
		$('#taxes-saved').show();
		$('#the-taxes-saved').html(globalTaxDiscount);
	}
	if ((globalInsuranceDiscount>0) && (globalTaxDiscount>0)) {
		$('#and').show();
	}
	var location = "#section-11";
	scrollTo(location);
}