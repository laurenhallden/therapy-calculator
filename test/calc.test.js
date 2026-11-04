// Worked examples for js/calc.js. Run with:  node test/calc.test.js
// Each expected number was worked out by hand. The working is in the comments, so
// when a new year's numbers go in, you can re-check a couple of them the same way.

var assert = require('assert');
var C = require('../js/calc.js');
var data = require('../js/tax-years.js');
var Y = data.TAX_YEARS[2026];

var passed = 0;
function test(name, fn) {
	try { fn(); passed++; console.log('  ok  ' + name); }
	catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}

console.log('Tax year data');

Object.keys(data.TAX_YEARS).forEach(function (yr) {
	var y = data.TAX_YEARS[yr];
	test(yr + ' has every field filled in', function () {
		['single', 'joint', 'head'].forEach(function (s) {
			assert.ok(y.brackets[s].length === 7, s + ' should have 7 brackets');
			assert.ok(y.standardDeduction[s] > 0, s + ' standard deduction');
			for (var i = 1; i < 7; i++) assert.ok(y.brackets[s][i][0] > y.brackets[s][i - 1][0], s + ' thresholds go up');
		});
		assert.ok(y.fsaLimit > 0 && y.hsaLimit.self > 0 && y.hsaLimit.family > y.hsaLimit.self);
		assert.ok(y.socialSecurityWageBase > 0);
	});
});

console.log('Income tax');

test('single, $50,000 taxable', function () {
	// 12,400 x 10% = 1,240  +  (50,000 - 12,400) x 12% = 4,512   -> 5,752
	assert.strictEqual(C.incomeTax(50000, 'single', Y), 5752);
});

test('joint, $100,000 taxable', function () {
	// 24,800 x 10% = 2,480  +  (100,000 - 24,800) x 12% = 9,024  -> 11,504
	assert.strictEqual(Math.round(C.incomeTax(100000, 'joint', Y)), 11504);
});

test('standard deduction comes off before tax', function () {
	assert.strictEqual(C.taxableIncome(80000, 'single', Y), 63900);
	assert.strictEqual(C.taxableIncome(10000, 'single', Y), 0);
});

console.log('FSA / HSA');

test('single, $80k income, $3,400 FSA', function () {
	// taxable 63,900 -> 60,500, all in the 22% bracket: 3,400 x 22% = 748
	// payroll tax: 3,400 x 7.65% = 260
	var r = C.preTaxSavings({ income: 80000, contribution: 3400, status: 'single', year: Y });
	assert.deepStrictEqual(r, { incomeTax: 748, payrollTax: 260, total: 1008 });
});

test('above the Social Security wage base, only Medicare is saved', function () {
	// taxable 183,900 -> 180,500, 24% bracket: 816. Medicare 3,400 x 1.45% = 49.30
	var r = C.preTaxSavings({ income: 200000, contribution: 3400, status: 'single', year: Y });
	assert.deepStrictEqual(r, { incomeTax: 816, payrollTax: 49, total: 865 });
});

test('HSA deposited on your own skips payroll savings', function () {
	var r = C.preTaxSavings({ income: 80000, contribution: 3400, status: 'single', year: Y, payroll: false });
	assert.strictEqual(r.total, 748);
});

console.log('Medical expense deduction');

test('7.5% floor + standard deduction: $10k therapy on $80k usually saves nothing', function () {
	// floor = 6,000, so 4,000 is deductible. 4,000 < 16,100 standard deduction -> 0
	// (the 2018 code said about $2,200 here)
	var r = C.medicalDeductionSavings({ agi: 80000, medicalExpenses: 10000, status: 'single', year: Y });
	assert.strictEqual(r.floor, 6000);
	assert.strictEqual(r.deductibleMedical, 4000);
	assert.strictEqual(r.savings, 0);
});

test('already itemizing: all of the deductible part helps', function () {
	// other itemized 20,000 (> 16,100). Taxable 60,000 -> 56,000, 22%: 880
	var r = C.medicalDeductionSavings({ agi: 80000, medicalExpenses: 10000, otherItemized: 20000, status: 'single', year: Y });
	assert.strictEqual(r.savings, 880);
});

test('close to itemizing: only the part above the standard deduction helps', function () {
	// other 14,000 + medical 4,000 = 18,000. Beats 16,100 by 1,900. 1,900 x 22% = 418
	var r = C.medicalDeductionSavings({ agi: 80000, medicalExpenses: 10000, otherItemized: 14000, status: 'single', year: Y });
	assert.strictEqual(r.savings, 418);
});

test('therapy share when there are other medical bills too', function () {
	// all medical 9,000 - floor 6,000 = 3,000; 14,000 + 3,000 = 17,000 vs 16,100 -> 900 x 22% = 198
	// other medical alone (5,000) is under the floor -> 0. Therapy's share: 198
	var r = C.therapyDeductionSavings({ agi: 80000, therapyExpenses: 4000, otherMedical: 5000, otherItemized: 14000, status: 'single', year: Y });
	assert.strictEqual(r.savings, 198);
});

console.log('Putting the tax steps together');

test('FSA + itemizing does not double-count', function () {
	// FSA 3,400 -> saves 1,008 (see above). AGI 76,600.
	// After-tax therapy 12,000 - 3,400 = 8,600. Floor 5,745 -> 2,855 deductible.
	// Other itemized 20,000: taxable 56,600 -> 53,745, 22%: 628
	// Total 1,636. Final cost 12,000 - 1,636 = 10,364
	var r = C.combineTaxSavings({ income: 80000, status: 'single', year: Y, costAfterInsurance: 12000,
		contribution: 3400, itemize: true, otherItemized: 20000 });
	assert.strictEqual(r.preTax.total, 1008);
	assert.strictEqual(r.itemizedSavings, 628);
	assert.strictEqual(r.totalTaxSavings, 1636);
	assert.strictEqual(r.finalYearlyCost, 10364);
});

test('FSA contribution is capped at what therapy actually costs', function () {
	var r = C.combineTaxSavings({ income: 80000, status: 'single', year: Y, costAfterInsurance: 1000, contribution: 3400 });
	assert.strictEqual(r.contribution, 1000);
});

console.log('Insurance');

test('in-network: deductible, then copays', function () {
	// $150 x 6 = 900 toward the $1,000 deductible; session 7: 100 + $30 copay;
	// sessions 8-48: 41 x 30 = 1,230.  900 + 130 + 1,230 = 2,260
	assert.strictEqual(C.inNetworkYearlyCost({ rate: 150, sessions: 48, copay: 30, deductible: 1000 }), 2260);
});

test('in-network: out-of-pocket max caps it', function () {
	assert.strictEqual(C.inNetworkYearlyCost({ rate: 150, sessions: 48, copay: 30, deductible: 1000, outOfPocketMax: 2000 }), 2000);
});

test('out-of-network with an approved amount', function () {
	// approved 150 of a $200 rate: $50 x 48 = 2,400 you always pay.
	// deductible: 6 x 150 = 900; session 7: 100 + 50 x 30% = 115; sessions 8-48: 41 x 45 = 1,845
	// 900 + 115 + 1,845 + 2,400 = 5,260
	assert.strictEqual(C.outOfNetworkYearlyCost({ rate: 200, sessions: 48, deductible: 1000, coinsurancePercent: 30, approvedAmount: 150 }), 5260);
});

test('out-of-network: max caps your share, but not charges above the approved amount', function () {
	// share capped at 2,500, plus 2,400 above approved = 4,900
	assert.strictEqual(C.outOfNetworkYearlyCost({ rate: 200, sessions: 48, deductible: 1000, coinsurancePercent: 30, approvedAmount: 150, outOfPocketMax: 2500 }), 4900);
});

console.log('Sliding scale');

test('estimates by income', function () {
	assert.strictEqual(C.estimateSessionRate(150000, data.SLIDING_SCALE), 160);
	assert.strictEqual(C.estimateSessionRate(70000, data.SLIDING_SCALE), 105);
	assert.strictEqual(C.estimateSessionRate(30000, data.SLIDING_SCALE), 60);
	assert.strictEqual(C.estimateSessionRate(5000, data.SLIDING_SCALE), 20);
});

console.log('\n' + passed + ' passed' + (process.exitCode ? ', some FAILED' : ''));
