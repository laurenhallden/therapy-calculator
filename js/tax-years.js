// ************************************************
// Every number that changes from year to year lives in this file.
// To add a new year, copy the most recent entry, update each value,
// and update the source link next to it.
// ************************************************
//
// Brackets are listed as [threshold, rate]: the rate applies to taxable
// income ABOVE that threshold, up to the next one.
//
// status: 'official' means every number came from an IRS/SSA release.
//         'projected' means some numbers are estimates. The page shows a
//         warning banner for projected years.

var TAX_YEARS = {
	2026: {
		status: 'official',

		// Source: IRS Rev. Proc. 2025-32, section 4.01
		// https://www.irs.gov/pub/irs-drop/rp-25-32.pdf
		brackets: {
			single: [[0, .10], [12400, .12], [50400, .22], [105700, .24], [201775, .32], [256225, .35], [640600, .37]],
			joint:  [[0, .10], [24800, .12], [100800, .22], [211400, .24], [403550, .32], [512450, .35], [768700, .37]],
			head:   [[0, .10], [17700, .12], [67450, .22], [105700, .24], [201750, .32], [256200, .35], [640600, .37]]
		},

		// Source: IRS Rev. Proc. 2025-32, section 4.14
		standardDeduction: { single: 16100, joint: 32200, head: 24150 },

		// Source: IRS Rev. Proc. 2025-32, section 4.29 (health FSA salary reduction limit)
		fsaLimit: 3400,

		// Source: IRS Rev. Proc. 2025-19 (HSA limits, released May 2025)
		hsaLimit: { self: 4400, family: 8750 },

		// Medical expenses are deductible only above this share of AGI.
		// 7.5% was made permanent by the Consolidated Appropriations Act, 2021.
		// Source: https://www.irs.gov/taxtopics/tc502
		medicalExpenseFloor: .075,

		// Payroll taxes that FSA and payroll HSA contributions also skip.
		// Social Security is 6.2% up to the wage base; Medicare is 1.45% on everything.
		// Source: https://www.ssa.gov/oact/cola/cbb.html
		socialSecurityRate: .062,
		socialSecurityWageBase: 184500,
		medicareRate: .0145
	},

	2027: {
		status: 'projected',

		// PROJECTED: 2026 thresholds x 1.032, rounded down to $25.
		// Replace with IRS Rev. Proc. for tax year 2027 when it's published (usually late Oct / early Nov 2026).
		brackets: {
			single: [[0, .10], [12775, .12], [52000, .22], [109075, .24], [208225, .32], [264400, .35], [661075, .37]],
			joint:  [[0, .10], [25575, .12], [104025, .22], [218150, .24], [416450, .32], [528825, .35], [793275, .37]],
			head:   [[0, .10], [18250, .12], [69600, .22], [109075, .24], [208200, .32], [264375, .35], [661075, .37]]
		},

		// PROJECTED: Wolters Kluwer / Bloomberg Tax estimates. Replace with the IRS Rev. Proc.
		standardDeduction: { single: 16600, joint: 33200, head: 24950 },

		// PROJECTED: Replace with the IRS Rev. Proc.
		fsaLimit: 3500,

		// OFFICIAL. Source: IRS Rev. Proc. 2026-24 (released May 29, 2026)
		hsaLimit: { self: 4500, family: 9000 },

		medicalExpenseFloor: .075,

		// OFFICIAL. Source: SSA announcement, Oct 14, 2026 (https://www.ssa.gov/oact/cola/cbb.html)
		socialSecurityRate: .062,
		socialSecurityWageBase: 192300,
		medicareRate: .0145
	}
};

// The year the page uses unless the visitor picks another one.
var DEFAULT_TAX_YEAR = 2026;

// Rough sliding-scale estimates. These aren't from any official source:
// they started as averages of a few published sliding scales in 2018 and
// were bumped about 30% for inflation in 2026. Adjust whenever you like.
// Each row: [household income above this amount, estimated per-session rate]
var SLIDING_SCALE = {
	rows: [[120000, 160], [100000, 130], [65000, 105], [38000, 80]],
	// Below the lowest row: $2 per $1,000 of income, rounded up to $5
	perThousandBelow: 2,
	minimumRate: 20,
	// Incomes at or below this see the "you may qualify for a discount" note
	discountNoteAtOrBelow: 120000
};

if (typeof module !== 'undefined') {
	module.exports = { TAX_YEARS: TAX_YEARS, DEFAULT_TAX_YEAR: DEFAULT_TAX_YEAR, SLIDING_SCALE: SLIDING_SCALE };
}
