function stepOne(income) {
	// See if a sliding scale payment
	if (income > 90000 ) {
		var baserate = 125;
	}
	else {
		$("#sliding-scale-div").html("You may qualify for a sliding scale fee!");
	}
	if (income > 90000 ) {
	}
	else if (income > 74999) {
		var baserate = 100;
	}
	else if (income > 49999) {
		var baserate = 80;
	}
	else if (income > 29000) {
		var baserate = 60;
	}
	else if (income < 29001) {
		var baserate = (income/1000*2);
	}
	setBaseRate(baserate);
}

function setBaseRate(baserate){
	console.log("baserate:" + baserate);
	console.log("yearly:" + baserate * 48);
	$("#baserate-span").html(baserate);
	window.globalSessionRate = baserate;
	$("#yearly-cost-span").html(baserate * 48);
	window.globalYearlyCost = baserate * 48;
}

function getInsurance() {
	console.log("we would show the insurance section");
}

function applyInsurance(deductible,coinsurance) {
	// If therapy costs more than your deductible...
	if (globalYearlyCost > deductible) {
		var coinsuranceRate = coinsurance/100;
		var coinsuranceCost = ((globalYearlyCost-deductible)*(coinsuranceRate)); // ...apply coinsurance to the remainder
		yearlyCostWithInsurance = (coinsuranceCost+deductible);
		// Let's store the actual amount insurance saves you so we can report on it later
		window.globalInsuranceDiscount = (globalYearlyCost - yearlyCostWithInsurance);
		console.log("yearly with insurance:" + yearlyCostWithInsurance);
		// For now, let's report how much insurance lowers your yearly cost and session rate:
		$("#insurance-yearly-span").html(yearlyCostWithInsurance);
		$("#insurance-baserate-span").html(yearlyCostWithInsurance/48);
		window.globalSessionRate = (yearlyCostWithInsurance/48);
		window.globalYearlyCost = yearlyCostWithInsurance;
	}
	else {
		// The deductible on this insurance is too high to help
		// That sucks; let's be sympathetic
		console.log("insurance does not help");
	}
}


function setFSA() {
	// Check to see if the yearly cost of therapy is less than the max allowed FSA contribution
	if (yearlyCostWithInsurance > 2600) {
		$("#fsa-field").html(2600);
	}
	else {
		$("#fsa-field").html(yearlyCostWithInsurance);
	}
}

function getFSA(fsaAmount) {
	// Apply some marginal tax rates, yo!
	if (globalIncome > 418400) {
		var taxRate = .3960
		var baseTaxes = 121505.25;
		var amountOver = 418400;
	}
	else if (globalIncome > 416700) {
		var taxRate = .35
		var baseTaxes = 120910.25;
		var amountOver = 416700;
	}
	else if (globalIncome > 191650) {
		var taxRate = .33
		var baseTaxes = 46643.75;
		var amountOver = 191650;
	}
	else if (globalIncome > 91900) {
		var taxRate = .28
		var baseTaxes = 18713.75;
		var amountOver = 91900;
	}
	else if (globalIncome > 37950) {
		var taxRate = .25
		var baseTaxes = 5226.25;
		var amountOver = 37950;
	}
	else if (globalIncome > 9325) {
		var taxRate = .15
		var baseTaxes = 932.50;
		var amountOver = 9325;
	}
	else if (globalIncome > 0) {
		var taxRate = .10
		var baseTaxes = 0;
		var amountOver = 0;
	}
	var taxesOwed = ((globalIncome - amountOver)*taxRate)+baseTaxes;
	console.log((globalIncome - amountOver)*taxRate);
	console.log("taxes owed" + taxesOwed)
	var taxesOwedWithFSA = ((globalIncome - fsaAmount - amountOver)*taxRate)+baseTaxes;
	console.log("taxes owed with fsa" + taxesOwedWithFSA);
	var taxDiscount = taxesOwed-taxesOwedWithFSA;
	var yearlyCostWithFsa = (globalYearlyCost - taxDiscount);
	console.log("yearly cost with fsa" + yearlyCostWithFsa);
	console.log("tax discount" + taxDiscount);
	window.globalTaxDiscount = taxDiscount;
	globalYearlyCost = yearlyCostWithFsa;
	globalSessionRate = (globalYearlyCost/48);
	$("#tax-discount-span").html(globalTaxDiscount);

}

function getSummary() {
	// We're done! Let's report our findings:
	console.log("testing");
	$("#final-session-rate").html(globalSessionRate);
	$("#final-yearly-cost").html(globalYearlyCost);
	$("#insurance-saved").html(globalInsuranceDiscount);
	$("#taxes-saved").html(globalTaxDiscount);
}




//Clients with an annual income would pay	the following per session
//$100,000 or more	$125
//$80,000 – $99,999	$100
//$50,000 – $79,999	$80
//$30,000 – $49,999	$60
//$29,000 or below	$2/every thousand