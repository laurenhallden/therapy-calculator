// This is complicated but I'll try to comment it out so you know what's going on!
//
// The actual math lives in js/calc.js, and every number that changes yearly
// lives in js/tax-years.js. This file just connects them to the page.

// ************************************************
// Tax year helpers
// ************************************************

window.taxYear = DEFAULT_TAX_YEAR;

function yearData() {
	return TAX_YEARS[taxYear];
}

function money(n) {
	return Math.round(n).toLocaleString('en-US');
}

function toNumber(value) {
	if (value === undefined || value === null) return 0;
	var n = parseFloat(String(value).replace(/[,$\s]/g, ''));
	return isNaN(n) ? 0 : n;
}

// Fill in every <span data-year-value="..."> on the page from tax-years.js,
// so the text never disagrees with the math.
function fillYearText() {
	var y = yearData();
	var values = {
		'year': taxYear,
		'fsaLimit': '$' + money(y.fsaLimit),
		'hsaSelf': '$' + money(y.hsaLimit.self),
		'hsaFamily': '$' + money(y.hsaLimit.family),
		'standardSingle': '$' + money(y.standardDeduction.single),
		'standardJoint': '$' + money(y.standardDeduction.joint),
		'standardHead': '$' + money(y.standardDeduction.head),
		'medicalFloor': (y.medicalExpenseFloor * 100) + '%'
	};
	$('[data-year-value]').each(function () {
		$(this).html(values[$(this).attr('data-year-value')]);
	});
	$('#projected-year-note').toggle(y.status === 'projected');
}

// Build the year dropdown from whatever years are in tax-years.js
$(document).ready(function () {
	Object.keys(TAX_YEARS).forEach(function (yr) {
		var label = yr + (TAX_YEARS[yr].status === 'projected' ? ' (some numbers are estimates)' : '');
		$('#tax-year').append($('<option>').val(yr).text(label).prop('selected', parseInt(yr, 10) === DEFAULT_TAX_YEAR));
	});
	fillYearText();
});

$('#tax-year').on('change', function () {
	window.taxYear = parseInt($(this).val(), 10);
	fillYearText();
});


// ************************************************
// Section ONE: see if a sliding scale payment applies
// ************************************************

function stepOne(income){
	// The estimates themselves live in SLIDING_SCALE in tax-years.js
	var baserate = TherapyCalc.estimateSessionRate(income, SLIDING_SCALE);
	if (income <= SLIDING_SCALE.discountNoteAtOrBelow) {
		$('#sliding-scale-div').html("<h2>You may qualify for a discount!</h2><p>It may be worth it to seek out a therapist who offers sliding-scale fees.</p>");
	}
	setBaseRate(baserate);

	// Move on to the next section
	var end = '#section-2';
	scrollTo(end);

	// Initialize the baserate slider in section two
	var $slider = new Foundation.Slider($('.slider'), {
	  initialStart : baserate,
	  start: 20,
	  end: 300,
	  step: 5,
	});
}


// ************************************************
// Section TWO: Set a basic per-session rate based on their income
// ************************************************

function setBaseRate(baserate){
	$('#baserate-span').html(money(baserate));
	window.globalSessionRate = baserate; // we're going to push variables we'll need later to the DOM
	window.globalYearlyCost = (baserate * globalNumberOfSessions);
	window.globalCostAfterInsurance = globalYearlyCost;
	$('#yearly-cost-span').html(money(globalYearlyCost)); // Extrapolate a yearly cost
}


// ************************************************
// Section THREE: Which insurance section should we take them to?
// ************************************************

// Show and hide additional insurance options based on their coverage status
$('#covered-or-not').on('change', function(){
	var coveredYesNo = $('#covered-or-not :selected').val();
	if (coveredYesNo == 'not-covered') {
		$('#network-or-not-label').slideUp();
	}
	else {
		$('#network-or-not-label').slideDown();
	}
});

function checkInsurance(coveredYesNo, networkYesNo){
	if (coveredYesNo == "covered"){
		// If they're staying in the provider network (or don't have to worry about one)...
		if (networkYesNo == 'in-network' || networkYesNo == 'no-network'){
			var end = '#section-4';
		}
		else {
			var end = '#section-5'; // if they're not staying in-network
		}
	}
	else {
		var end = '#section-6'; // if they're not covered at all
	}
	scrollTo(end); // Send me to the section they selected
}


// ************************************************
// Section FOUR: Calculate their in-network insurance benefits
// ************************************************

function applyNetworkInsurance(copay, deductible, outOfPocketMax){
	var yearlyCostWithInsurance = TherapyCalc.inNetworkYearlyCost({
		rate: toNumber(globalSessionRate),
		sessions: toNumber(globalNumberOfSessions),
		copay: copay,
		deductible: deductible,
		outOfPocketMax: outOfPocketMax
	});
	if (yearlyCostWithInsurance < globalYearlyCost) {
		window.globalInsuranceDiscount = (globalYearlyCost - yearlyCostWithInsurance);
		setInsurance(yearlyCostWithInsurance);
		// Insurance helped, so let's show the paragraph that says so, and a corresponding heading
		$('#section-6 h2').html("Making progress!");
		$('#insurance-results').show();
	}
	else if (globalYearlyCost <= deductible) {
		// The deductible on this insurance is too high to help
		// That sucks; let's be sympathetic
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p id='insurance-results'>You didn’t save any money this way. If you have a choice between several insurance plans, it may be worth it for you to see if you can pay slightly more per month for insurance with a lower deductible.</p>");
	}
	else {
		// The copays are too high
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p id='insurance-results'>You didn’t save any money this way. If you have a choice between several insurance plans, it may be worth it for you to see if you can get access to a plan with lower copays.</p>");
	}
	var end = '#section-6';
	scrollTo(end);  // Moving on!
}


// ************************************************
// Section FIVE: Calculate their out-of-network insurance benefits
// ************************************************

function applyInsurance(deductible, coinsurance, outofnetworkCopay, approvedAmount, outOfPocketMax){
	var yearlyCostWithInsurance = TherapyCalc.outOfNetworkYearlyCost({
		rate: toNumber(globalSessionRate),
		sessions: toNumber(globalNumberOfSessions),
		deductible: deductible,
		coinsurancePercent: coinsurance,
		copay: outofnetworkCopay,
		approvedAmount: approvedAmount, // 0 means "no limit"
		outOfPocketMax: outOfPocketMax
	});
	var insuranceDiscount = globalYearlyCost - yearlyCostWithInsurance;

	if (insuranceDiscount > 0) {
		window.globalInsuranceDiscount = insuranceDiscount;
		setInsurance(yearlyCostWithInsurance);
		// Insurance helped, so let's show the paragraph that says so, and a corresponding heading
		$('#insurance-results').show();
		$('#section-6 h2').html("Making progress!");
		// Send a tip to the final summary list
		$('#summary-tips-label').show();
		$('#summary-tips').append("<li>To use your insurance, you’ll need to save your receipts and submit insurance claims. Many therapists can give you a “superbill” that has everything your insurance needs.</li>");
		$('#summary-tips').append("<li>I highly recommend taking pictures of your receipts and saving them in an album on your phone, or backing them up to a service like Dropbox or Google Photos.</li>");
		window.globalTrackingReceipts = "yes"; // For the tips section at the end, we need to know if this person is submitting receipts
	}
	else if (globalYearlyCost <= deductible) {
		// The deductible on this insurance is too high to help
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p class='border-bottom'>You didn’t save any money this way. It may be worth it to see if you can get a plan that costs a little more per month but has a lower deductible.</p>");
	}
	else {
		// We tried really hard, but their insurance just had too many restrictions to be helpful
		$('#section-6 .variable-content').html("<h2>Ah, bummer.</h2><p class='border-bottom'>You didn’t save any money this way. It may be worth it to see if you can get a plan that costs a little more per month but has fewer costs when you use it.</p>");
	}
	var end = "#section-6";
	scrollTo(end); // Moving on!
}


// ************************************************
// Section SIX: Reporting on the insurance results
// ************************************************

function setInsurance(yearlyCostWithInsurance){
	// Let's report how much insurance lowers their yearly cost and session rate:
	$('#insurance-yearly-span').html(money(yearlyCostWithInsurance));
	var sessionRateWithInsurance = Math.round(yearlyCostWithInsurance / globalNumberOfSessions);
	$('#insurance-baserate-span').html(money(sessionRateWithInsurance));
	window.globalSessionRate = sessionRateWithInsurance;
	window.globalYearlyCost = yearlyCostWithInsurance;
	window.globalCostAfterInsurance = yearlyCostWithInsurance; // the tax steps all start from this number
}


// ************************************************
// Section SEVEN and EIGHT: How much can they put in an FSA or HSA?
// ************************************************

function setFSA(){
	// Suggest whichever is smaller: the yearly cost of therapy, or the FSA limit
	$('#fsa-field').val(Math.min(globalCostAfterInsurance, yearData().fsaLimit));
	var end = '#section-7';
	scrollTo(end); // Moving on!
}

function hsaLimit() {
	return yearData().hsaLimit[$('#hsa-coverage :selected').val() || 'self'];
}

function setHSA(){
	// Suggest whichever is smaller: the yearly cost of therapy, or the HSA limit for their coverage
	$('#hsa-field').val(Math.min(globalCostAfterInsurance, hsaLimit()));
	var end = '#section-8';
	scrollTo(end);
}

$('#hsa-coverage').on('change', function () {
	$('#hsa-field').val(Math.min(globalCostAfterInsurance, hsaLimit()));
});


// ************************************************
// Section NINE: Doing Yer Taxes and reporting the results
// ************************************************

// First, the people who are ineligible for an FSA/HSA -- we need their filing status
// Show and hide that dropdown, plus the "other deductions" fields
$('input[name="itemized-deductions"]').on('change', function(){
	var itemizedYesNo = $('input[name="itemized-deductions"]:checked').val();
	if (itemizedYesNo == 'Yes') {
		$('#other-deductions').slideDown();
		if (taxBracket == 'notSet') { // get their filing status if they didn't tell us already
			$('#tax-bracket-2-label').slideDown();
		}
	}
	else {
		$('#other-deductions').slideUp();
		$('#tax-bracket-2-label').slideUp();
	}
});

// Let's figure out how much a pre-tax account or an itemized deduction would save them.
// This function is used by FSA, HSA and Itemized Deductions.
// All of the tax steps are recalculated together every time (see combineTaxSavings in calc.js),
// so a second step never double-counts the first.
function doTaxes(contribution, fromWhere){
	if (fromWhere == 'fsa') {
		window.globalPreTaxContribution = Math.min(toNumber(contribution), yearData().fsaLimit);
	}
	else if (fromWhere == 'hsa') {
		window.globalPreTaxContribution = Math.min(toNumber(contribution), hsaLimit());
	}
	else if (fromWhere == 'itemized') {
		window.globalItemize = true;
	}

	var result = TherapyCalc.combineTaxSavings({
		income: globalIncome,
		status: taxBracket,
		year: yearData(),
		costAfterInsurance: globalCostAfterInsurance,
		contribution: globalPreTaxContribution,
		payroll: true, // assumes FSA/HSA money comes out of a paycheck
		itemize: globalItemize,
		otherMedical: globalOtherMedical,
		otherItemized: globalOtherItemized
	});
	window.globalPreTaxContribution = result.contribution;
	window.globalTaxDiscount = result.totalTaxSavings;
	window.globalYearlyCost = result.finalYearlyCost;
	window.globalSessionRate = Math.round(globalYearlyCost / globalNumberOfSessions);
	reportTaxes(fromWhere, result); // Depending on where they came from, report results as shown below
}

function reportTaxes(fromWhere, result){
	if (fromWhere == "itemized"){
		var end = "#section-10";
		var it = result.itemized;
		if (result.itemizedSavings > 0) {
			$('#itemized-tax-discount-span').html(money(result.itemizedSavings));
			$('#section-10 .variable-content #itemized-tax-results').show();
			$('#go-to-summary').html("And that’s just about everything I can think to check for you. Ready for your results?");
			if (result.preTax.total > 0) { // if we're combining multiple tax discounts, mention the total too
				$('#itemized-last').html(" more on your taxes by claiming your medical expenses, for a total tax savings of $" + money(result.totalTaxSavings));
				$('#section-10 .variable-content h2').html("It keeps getting better!");
			}
			$('#summary-tips').append("<li>You asked to claim your medical expenses on your taxes, so you'll need to itemize your deductions. You should also keep a copy of your receipts in case the IRS wants them later.</li>");
		}
		else if (it.deductibleMedical == 0) {
			$('#section-10 .variable-content').html("<h2>That one doesn’t help, sorry.</h2><p>Only medical bills above " + (yearData().medicalExpenseFloor * 100) + "% of your Adjusted Gross Income (about $" + money(it.floor) + " for you) can be deducted, and your therapy costs paid with after-tax money don’t get past that. Anything you paid from an FSA or HSA doesn’t count here, since it already skipped taxes.</p>");
		}
		else {
			$('#section-10 .variable-content').html("<h2>That one doesn’t help, sorry.</h2><p>About $" + money(it.deductibleMedical) + " of your medical bills get past the " + (yearData().medicalExpenseFloor * 100) + "% floor, which brings your itemized deductions to about $" + money(it.itemizedTotal) + ". That’s not more than your $" + money(it.standardDeduction) + " standard deduction, so you’d probably pay the same taxes either way.</p>");
		}
	}
	else {
		if (fromWhere == 'fsa'){
			$('#section-9 .variable-content #used-what').html(" by using your FSA");
			if (globalTrackingReceipts == "yes"){ // If this person is submitting manual claims, give these tips
				$('#summary-tips').append("<li>After your insurance claims are processed, you can pay for the remaining balance with your FSA. Yep, it's a two-step process. You can submit the Explanation of Benefits from your insurance claims once they’re complete, and copies of your original receipts.</li>");
			}
			else { // if not, give these ones
				$('#summary-tips').append("<li>To use your Flexible Spending Account, you’ll need to save your receipts and submit claims with your FSA.</li>");
				$('#summary-tips').append("<li>I highly recommend taking pictures of your receipts and saving them in an album on your phone, or backing them up to a service like Dropbox or Google Photos.</li>");
			}
		}
		else if (fromWhere == 'hsa'){
			$('#section-9 .variable-content #used-what').html(" by using your HSA");
			if (globalTrackingReceipts == 'yes'){ // If this person is submitting manual claims, give these tips
				$('#summary-tips').append("<li>After your insurance claims are processed, you can pay for the remaining balance with your HSA. Yep, it's a two-step process. You can submit the Explanation of Benefits from your insurance claims once they’re complete, and copies of your original receipts.</li>");
			}
			else { // if not, give these ones
				$('#summary-tips').append("<li>To use your Health Savings Account, you’ll need to save your receipts and submit claims with your HSA.</li>");
				$('#summary-tips').append("<li>I highly recommend taking pictures of your receipts and saving them in an album on your phone, or backing them up to a service like Dropbox or Google Photos.</li>");
			}
		}
		$('#tax-discount-span').html(money(result.preTax.total));
		$('#tax-breakdown').html(" ($" + money(result.preTax.incomeTax) + " in income tax, and $" + money(result.preTax.payrollTax) + " in Social Security and Medicare taxes)");
		var end = '#section-9';
		setTaxResults();
		checkItemized();
	}
	$('#summary-tips-label').show();
	scrollTo(end);
}

// Change the content of the tax results div based on their tax savings
function setTaxResults() {
	$('#section-9 .variable-content h2').html('Guess what?');
	$('#section-9 #additional-taxes').html("another"); // changing a word based on whether we have multiple tax tips
	$('#section-9 .variable-content #tax-results').show();
}

// Show them how their therapy bills compare to the 7.5% floor
function checkItemized(){
	var contribution = globalPreTaxContribution || 0;
	var agi = globalIncome - contribution;
	var afterTaxTherapy = Math.max(0, globalCostAfterInsurance - contribution);
	var percentageOfIncome = (agi > 0) ? (afterTaxTherapy / agi * 100).toFixed(2) : '0';
	$('#income-percentage').html(percentageOfIncome);
	$('#medical-floor-amount').html(money(agi * yearData().medicalExpenseFloor));
}


// ************************************************
// Section TEN: If itemized deductions are requested, go back through the tax loop above
// ************************************************

function getItemized() {
	window.globalOtherMedical = toNumber($('#other-medical-field').val());
	window.globalOtherItemized = toNumber($('#other-itemized-field').val());
	doTaxes(0, "itemized");
}


// ************************************************
// Section ELEVEN: We're done! Let's report our findings:
// ************************************************

function getSummary() {
	$('#final-session-rate').html(money(globalSessionRate));
	$('#final-yearly-cost').html(money(globalYearlyCost));
	if ((globalInsuranceDiscount>0) || (globalTaxDiscount>0)) {
		$('#but').show();
	}
	if (globalInsuranceDiscount>0) {
		$('#insurance-saved').show();
		$('#the-insurance-saved').html(money(globalInsuranceDiscount));
	}
	if (globalTaxDiscount>0) {
		$('#taxes-saved').show();
		$('#the-taxes-saved').html(money(globalTaxDiscount));
	}
	if ((globalInsuranceDiscount>0) && (globalTaxDiscount>0)) {
		$('#and').show();
	}
	var end = '#section-11';
	scrollTo(end);
}
