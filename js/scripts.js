function stepOne(income){
	// See if a sliding scale payment applies
	// These ranges are estimates based on a few sliding scales available online
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
		var baserate = 20; // 20 is the lower limit
	}
	setBaseRate(baserate);

	// Move on to the next section
	var location = "#section-2";
	scrollTo(location);

	// Initialize the baserate slider
	var $slider = new Foundation.Slider($('.slider'), {
	  initialStart : baserate,
	  start: 20,
	  end: 150,
	  step: 5,
	});
}

// Set a base per-session rate based on income
function setBaseRate(baserate){
	console.log("baserate:" + baserate);
	console.log("yearly:" + baserate * globalNumberOfSessions);
	$('#baserate-span').html(baserate);
	window.globalSessionRate = baserate;
	// Extrapolate a yearly cost
	$('#yearly-cost-span').html(baserate * globalNumberOfSessions);
	window.globalYearlyCost = baserate * globalNumberOfSessions;
	$('#section-2').toggleClass('hidden');
}

// Which insurance section are we going to?
function checkInsurance(coveredYesNo, networkYesNo){
	if (coveredYesNo == "covered") {
		if (networkYesNo == "in-network") {
			var location = "#section-4";
		}
		else {
			var location = "#section-5";
		}
	}
	else {
		var location = "#section-6";
	}
	scrollTo(location); // Send me there
}

// Show and hide additional insurance options based on your coverage status
$("#covered-or-not").on('change', function(){
	var coveredYesNo = $('#covered-or-not :selected').val();
    if (coveredYesNo == "not-covered") {
    	$("#network-or-not-label").slideUp();
    }
	else {
		$("#network-or-not-label").slideDown();
	}
});

//Apply in-network insurance benefits
function applyNetworkInsurance(copay,deductible){
	console.log("working on this copay thing");
	if (globalYearlyCost > deductible){
		var sessionsToHitDeductible = (deductible/globalSessionRate);
		var sessionsRemaining = (globalNumberOfSessions - sessionsToHitDeductible);
		sessionsRemaining = Math.round(sessionsRemaining);
		yearlyCostWithInsurance = ((sessionsRemaining * copay) + deductible);
		console.log("yearly cost with insurance: " + yearlyCostWithInsurance);
		setInsurance(yearlyCostWithInsurance);
		// Insurance helped, so let's show the paragraph that says so, and a corresponding heading
		$('#insurance-results').show();
		$('#section-6 h2').html("Making progress!");
	}
	else {
		// The deductible on this insurance is too high to help
		// That sucks; let's be sympathetic
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p>You didn't save any money this way. It may be worth it for you to consider paying slightly more per month for insurance with a lower deductible.</p>");
	}
	var location = "#section-6";
	scrollTo(location);
}

// Apply out-of-netork insurance benefits
function applyInsurance(deductible,coinsurance){
	// If therapy costs more than your deductible...
	if (globalYearlyCost > deductible) {
		var coinsuranceRate = coinsurance/100;
		var coinsuranceCost = ((globalYearlyCost-deductible)*(coinsuranceRate)); // ...apply coinsurance to the remainder
		yearlyCostWithInsurance = (coinsuranceCost+deductible);
		// Let's store the actual amount insurance saves you so we can report on it later
		window.globalInsuranceDiscount = (globalYearlyCost - yearlyCostWithInsurance);
		console.log('yearly with insurance:' + yearlyCostWithInsurance);
		setInsurance(yearlyCostWithInsurance);
		// Insurance helped, so let's show the paragraph that says so, and a corresponding heading
		$('#insurance-results').show();
		$('#section-6 h2').html("Making progress!");
	}
	else {
		// The deductible on this insurance is too high to help
		// That sucks; let's be sympathetic
		console.log('insurance does not help');
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p>You didn't save any money this way. It may be worth it for you to consider paying slightly more per month for insurance with a lower deductible.</p>");
	}
	var location = "#section-6";
	scrollTo(location);
}

function setInsurance(yearlyCostWithInsurance){
	// Let's report how much insurance lowers your yearly cost and session rate:
	$('#insurance-yearly-span').html(yearlyCostWithInsurance);
	var sessionRateWithInsurance = (yearlyCostWithInsurance/globalNumberOfSessions);
	// Round the session rate to a whole number
	sessionRateWithInsurance = Math.round(sessionRateWithInsurance);
	sessionRateWithInsurance = parseInt(sessionRateWithInsurance);
	console.log(sessionRateWithInsurance);
	$('#insurance-baserate-span').html(sessionRateWithInsurance);
	window.globalSessionRate = sessionRateWithInsurance;
	window.globalYearlyCost = yearlyCostWithInsurance;
}

function setFSA(){
	// Check to see if the yearly cost of therapy is less than the max allowed FSA contribution
	if (yearlyCostWithInsurance > 2600){
		$('#fsa-field').val(2600);
	}
	else {
		$('#fsa-field').val(yearlyCostWithInsurance);
	}
	var location = "#section-10";
	scrollTo(location);
}

function getFSA(fsaAmount){
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
	// This is a little simplistic, but we're checking what you would pay in taxes normally...
	var taxesOwed = ((globalIncome - amountOver)*taxRate)+baseTaxes;
	console.log(fsaAmount);
	console.log('taxes owed: ' + taxesOwed);
	console.log(globalIncome);
	// ...and then lowering your income by your FSA contribution, and checking again
	var taxesOwedWithFSA = ((globalIncome - fsaAmount - amountOver)*taxRate)+baseTaxes;
	console.log('taxes owed with fsa: ' + taxesOwedWithFSA);
	var taxDiscount = taxesOwed-taxesOwedWithFSA;
	var yearlyCostWithFsa = (globalYearlyCost - taxDiscount);
	console.log('yearly cost with fsa' + yearlyCostWithFsa);
	console.log('tax discount' + taxDiscount);
	window.globalTaxDiscount = taxDiscount;
	globalYearlyCost = yearlyCostWithFsa;
	globalSessionRate = (globalYearlyCost/globalNumberOfSessions);
	// Round the session rate to a whole number
	globalSessionRate = Math.round(globalSessionRate);
	$('#tax-discount-span').html(globalTaxDiscount);
}

function setHSA(){
	var location = "#section-8";
	scrollTo(location);
}

// We're done! Let's report our findings:
function getSummary() {
	$('#final-session-rate').html(globalSessionRate);
	$('#final-yearly-cost').html(globalYearlyCost);
	$('#insurance-saved').html(globalInsuranceDiscount);
	$('#taxes-saved').html(globalTaxDiscount);

	var location = "#section-11";
	scrollTo(location);
}