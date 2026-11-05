// ************************************************
// All of the math, with no page code mixed in.
// Every function takes plain numbers and returns plain numbers,
// so they can be tested on their own (see test/calc.test.js).
// Yearly figures (brackets, limits) come in as `year`, an entry from TAX_YEARS.
// ************************************************

var TherapyCalc = (function () {

	// ---------- Sliding scale ----------

	function estimateSessionRate(income, scale) {
		for (var i = 0; i < scale.rows.length; i++) {
			if (income > scale.rows[i][0]) {
				return scale.rows[i][1];
			}
		}
		var rate = Math.ceil(Math.round(income / 1000 * scale.perThousandBelow) / 5) * 5; // round up to $5
		return Math.max(rate, scale.minimumRate);
	}


	// ---------- Insurance ----------

	// In-network: you pay the full session rate until your deductible is met,
	// then just the copay. Your total can't go over your out-of-pocket max.
	// Leave outOfPocketMax empty (0, null) if you don't know it.
	function inNetworkYearlyCost(o) {
		var deductibleLeft = o.deductible || 0;
		var maxLeft = o.outOfPocketMax > 0 ? o.outOfPocketMax : Infinity;
		var total = 0;
		for (var i = 0; i < o.sessions; i++) {
			var towardDeductible = Math.min(o.rate, deductibleLeft);
			deductibleLeft -= towardDeductible;
			var rest = o.rate - towardDeductible;
			var share = towardDeductible + Math.min(o.copay || 0, rest);
			share = Math.min(share, maxLeft);
			maxLeft -= share;
			total += share;
		}
		return Math.round(total);
	}

	// Out-of-network: insurance only recognizes up to its "approved amount" per
	// session. You pay the deductible first, then any copay, then your
	// coinsurance percentage of what's left. Anything your therapist charges above
	// the approved amount is yours to pay, and does NOT count toward your out-of-pocket max.
	function outOfNetworkYearlyCost(o) {
		var allowed = (o.approvedAmount > 0) ? Math.min(o.rate, o.approvedAmount) : o.rate;
		var overApproved = o.rate - allowed;
		var deductibleLeft = o.deductible || 0;
		var maxLeft = o.outOfPocketMax > 0 ? o.outOfPocketMax : Infinity;
		var total = 0;
		for (var i = 0; i < o.sessions; i++) {
			var towardDeductible = Math.min(allowed, deductibleLeft);
			deductibleLeft -= towardDeductible;
			var rest = allowed - towardDeductible;
			var copayPart = Math.min(o.copay || 0, rest);
			var coinsurancePart = (rest - copayPart) * (o.coinsurancePercent / 100);
			var share = Math.min(towardDeductible + copayPart + coinsurancePart, maxLeft);
			maxLeft -= share;
			total += share + overApproved;
		}
		return Math.round(total);
	}

	// One plan's cost for a year of therapy: twelve months of premiums plus your
	// share of each session. network is 'in-network', 'out-of-network' or 'not-covered'.
	function planYearlyCost(o) {
		var therapy;
		if (o.network === 'in-network') therapy = inNetworkYearlyCost(o);
		else if (o.network === 'out-of-network') therapy = outOfNetworkYearlyCost(o);
		else therapy = Math.round(o.rate * o.sessions);
		var premiums = Math.round((o.monthlyPremium || 0) * 12);
		return { therapy: therapy, premiums: premiums, total: therapy + premiums };
	}


	// ---------- Taxes ----------

	// Federal income tax on taxable income, worked through each bracket.
	function incomeTax(taxable, status, year) {
		var brackets = year.brackets[status];
		var tax = 0;
		for (var i = 0; i < brackets.length; i++) {
			var low = brackets[i][0];
			var high = (i + 1 < brackets.length) ? brackets[i + 1][0] : Infinity;
			if (taxable <= low) break;
			tax += (Math.min(taxable, high) - low) * brackets[i][1];
		}
		return tax;
	}

	// You get the bigger of the standard deduction or your itemized deductions.
	function taxableIncome(agi, status, year, itemized) {
		var deduction = Math.max(year.standardDeduction[status], itemized || 0);
		return Math.max(0, agi - deduction);
	}

	// FSA and payroll HSA contributions skip both income tax and payroll tax (FICA).
	// Simplification: household income is treated as one paycheck for the
	// Social Security wage base. Set payroll: false for HSA money you deposit
	// yourself (that only skips income tax).
	function preTaxSavings(o) {
		var year = o.year;
		var before = incomeTax(taxableIncome(o.income, o.status, year), o.status, year);
		var after = incomeTax(taxableIncome(o.income - o.contribution, o.status, year), o.status, year);
		var payroll = 0;
		if (o.payroll !== false) {
			var wb = year.socialSecurityWageBase;
			var ssWagesBefore = Math.min(o.income, wb);
			var ssWagesAfter = Math.min(Math.max(o.income - o.contribution, 0), wb);
			payroll = (ssWagesBefore - ssWagesAfter) * year.socialSecurityRate + o.contribution * year.medicareRate;
		}
		return {
			incomeTax: Math.round(before - after),
			payrollTax: Math.round(payroll),
			total: Math.round(before - after + payroll)
		};
	}

	// Tax saved by itemizing medical expenses, compared with not counting them at all.
	// Only medical expenses above 7.5% of AGI count, and only if your
	// itemized total beats the standard deduction.
	//   medicalExpenses: everything paid out of pocket with after-tax money
	//                    (NOT anything paid from an FSA or HSA)
	//   otherItemized:   mortgage interest, state and local taxes, charity, etc.
	function medicalDeductionSavings(o) {
		var year = o.year;
		var floor = o.agi * year.medicalExpenseFloor;
		var deductibleMedical = Math.max(0, o.medicalExpenses - floor);
		var other = o.otherItemized || 0;
		var without = incomeTax(taxableIncome(o.agi, o.status, year, other), o.status, year);
		var withMedical = incomeTax(taxableIncome(o.agi, o.status, year, other + deductibleMedical), o.status, year);
		return {
			floor: Math.round(floor),
			deductibleMedical: Math.round(deductibleMedical),
			itemizedTotal: Math.round(other + deductibleMedical),
			standardDeduction: year.standardDeduction[o.status],
			savings: Math.round(without - withMedical)
		};
	}

	// How much of the medical deduction comes from therapy specifically:
	// savings with therapy + other medical bills, minus savings with just the other bills.
	function therapyDeductionSavings(o) {
		var all = medicalDeductionSavings({
			agi: o.agi, status: o.status, year: o.year, otherItemized: o.otherItemized,
			medicalExpenses: o.therapyExpenses + (o.otherMedical || 0)
		});
		var othersOnly = medicalDeductionSavings({
			agi: o.agi, status: o.status, year: o.year, otherItemized: o.otherItemized,
			medicalExpenses: o.otherMedical || 0
		});
		all.savings = all.savings - othersOnly.savings;
		return all;
	}

	// Puts the tax pieces together in the right order, so nothing gets counted twice:
	//   1. FSA/HSA money comes out of income before tax.
	//   2. Only therapy costs paid with after-tax money can be itemized
	//      (the IRS doesn't let you deduct what you paid from an FSA/HSA).
	//   3. The 7.5% floor is measured against AGI, which is income after the FSA/HSA contribution.
	function combineTaxSavings(o) {
		var contribution = Math.min(o.contribution || 0, o.costAfterInsurance);
		var preTax = contribution > 0
			? preTaxSavings({ income: o.income, contribution: contribution, status: o.status, year: o.year, payroll: o.payroll })
			: { incomeTax: 0, payrollTax: 0, total: 0 };
		var agi = o.income - contribution;
		var itemized = null;
		if (o.itemize) {
			itemized = therapyDeductionSavings({
				agi: agi, status: o.status, year: o.year,
				therapyExpenses: o.costAfterInsurance - contribution,
				otherMedical: o.otherMedical, otherItemized: o.otherItemized
			});
		}
		var itemizedSavings = itemized ? Math.max(0, itemized.savings) : 0;
		var totalSavings = preTax.total + itemizedSavings;
		return {
			contribution: contribution,
			agi: agi,
			preTax: preTax,
			itemized: itemized,
			itemizedSavings: itemizedSavings,
			totalTaxSavings: totalSavings,
			finalYearlyCost: o.costAfterInsurance - totalSavings
		};
	}

	return {
		combineTaxSavings: combineTaxSavings,
		estimateSessionRate: estimateSessionRate,
		inNetworkYearlyCost: inNetworkYearlyCost,
		outOfNetworkYearlyCost: outOfNetworkYearlyCost,
		planYearlyCost: planYearlyCost,
		incomeTax: incomeTax,
		taxableIncome: taxableIncome,
		preTaxSavings: preTaxSavings,
		medicalDeductionSavings: medicalDeductionSavings,
		therapyDeductionSavings: therapyDeductionSavings
	};
})();

if (typeof module !== 'undefined') {
	module.exports = TherapyCalc;
}
