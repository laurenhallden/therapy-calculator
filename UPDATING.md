# Updating the calculator for a new year

Every number that changes from year to year lives in `js/tax-years.js`. The page text reads from that file too, so updating it updates the whole calculator. This checklist covers where each number comes from, when it's released, and how to check your work.

Expect about an hour a year, spread across a few dates.

## The yearly calendar

The IRS releases next year's numbers over the course of the current year. For example, the 2028 numbers come out during 2027.

| When | What comes out | Updates in `tax-years.js` |
|---|---|---|
| **May** | HSA limits for next year | `hsaLimit` |
| **Mid-October** | Social Security wage base for next year | `socialSecurityWageBase` |
| **Late October / early November** | IRS inflation adjustments for next year | `brackets`, `standardDeduction`, `fsaLimit` |
| **January** | New editions of IRS Publications 502 and 969 | Nothing directly. Check for rule changes (see below). |

A good rhythm: add next year as a `projected` entry in May when the HSA limits come out, then switch it to `official` in November.

## Where to find each number

### HSA limits (`hsaLimit`): May
- **Search for:** `IRS HSA inflation adjusted amounts [next year]` or `Rev. Proc. [this year] HSA`
- **What it looks like:** a short IRS Revenue Procedure (Rev. Proc.) PDF, usually 2–3 pages.
- **Use:** the annual contribution limit for "self-only coverage" (`self`) and "family coverage" (`family`). Ignore the HDHP deductible and out-of-pocket numbers; the calculator doesn't use them.
- **Example:** 2027's came from Rev. Proc. 2026-24, released May 29, 2026.

### Social Security wage base (`socialSecurityWageBase`): mid-October
- **Where:** https://www.ssa.gov/oact/cola/cbb.html. It's announced together with the yearly Social Security cost-of-living increase.
- **Use:** the "contribution and benefit base" (also called the taxable maximum) for next year.
- The rates (`socialSecurityRate: .062` and `medicareRate: .0145`) are set by law and almost never change.

### Tax brackets, standard deduction, FSA limit: late October / early November
- **Search for:** `IRS inflation adjustments tax year [next year]`. The IRS posts a news release that links to the Revenue Procedure PDF.
- **Example:** the 2026 numbers came from Rev. Proc. 2025-32 (https://www.irs.gov/pub/irs-drop/rp-25-32.pdf).
- In the PDF:
  - **`brackets`:** section 4.01, "Tax Rate Tables." You need three tables: "Married Individuals Filing Joint Returns" (`joint`), "Heads of Households" (`head`), and "Unmarried Individuals" (`single`). Each row's "over" amount is a threshold in the file. For example, a row that reads "over $50,400 but not over $105,700: ... plus 22% of the excess over $50,400" becomes `[50400, .22]`.
  - **`standardDeduction`:** search the PDF for "Standard Deduction." Use the joint, head of household, and single amounts.
  - **`fsaLimit`:** search the PDF for "Cafeteria Plans." Use the dollar limit on salary reductions for health flexible spending arrangements.

### Medical expense floor (`medicalExpenseFloor`): only if the law changes
- It's 7.5%, and that's permanent law. You only need to change it if Congress changes it, which the January check below would catch.

## Rule changes to check each January

Numbers are the easy part. These are the places a rule change would show up:

1. **IRS Publication 502** (medical and dental expenses): https://www.irs.gov/publications/p502. Read the "What's New" section at the top. Look for changes to the 7.5% floor or to what counts as a medical expense.
2. **IRS Publication 969** (HSAs and other tax-favored health plans): https://www.irs.gov/publications/p969. Read "What's New." Look for changes to who can have an HSA or how FSAs work. (The 2026 change that made bronze and catastrophic Marketplace plans HSA-eligible showed up here.)
3. **IRS Topic 502**: https://www.irs.gov/taxtopics/tc502. A short summary of the medical deduction. Quick to confirm nothing changed.
4. **A quick search** for `[year] tax law changes HSA FSA medical deduction`, to catch new laws.

If something changed, update the explanation text in `index.html` and, if needed, the math in `js/calc.js`.

## Adding a new year, step by step

1. Open `js/tax-years.js`.
2. Copy the most recent year's entry and paste it below with the new year as its key (for example `2028: { ... }`).
3. Update every number from the sources above, and update the `// Source:` comment next to each one.
4. Set `status`:
   - `'official'` once every number comes from an IRS or SSA release.
   - `'projected'` if any are estimates. Mark those numbers with a `// PROJECTED` comment. The page will show an "estimates" note for that year.
5. When the new year should be what visitors see first, change `DEFAULT_TAX_YEAR` (just below the year entries) to that year.
6. Optionally remove the oldest year. The year dropdown lists every year in the file.
7. Run the checks below.

### Estimating a year before the IRS publishes it

If you want next year on the site before November, you can estimate the brackets: multiply each of this year's thresholds by about 1.03 (roughly a year of inflation) and round down to the nearest $25. Tax sites like Bloomberg Tax and Wolters Kluwer publish projections in the fall that you can compare against. Mark the year `'projected'`, then replace the estimates when the official numbers come out.

## Checking your work

1. **Run the tests:** `npm test` (or `node test/calc.test.js`). The first test checks that every year in the file has all its fields filled in and that the bracket thresholds go up in order. The rest are worked examples for 2026. They should keep passing no matter what you add.
2. **Spot-check one bracket by hand.** Pick a taxable income, like $50,000 single. Work it out from the IRS table: the 10% bracket amount, plus 12% of the rest. Then compare with `TherapyCalc.incomeTax(50000, 'single', TAX_YEARS[2028])` in your browser's developer console on the calculator page.
3. **Click through the calculator** with the new year selected. Check that:
   - The heading says "in [year] America."
   - The FSA section shows the new limit.
   - The HSA section shows both new limits.
   - The itemizing section shows the new standard deductions.
4. **Optional:** add a worked example for the new year to `test/calc.test.js`. Copy one of the existing tests and change the year and expected numbers.

## Not tied to the tax year (update whenever)

- **Sliding-scale estimates** (`SLIDING_SCALE` in `js/tax-years.js`): these are rough guesses, not official numbers. They were last raised in 2026. Bump them when they start to feel low compared with what therapists in your area charge.
- **Links in `index.html`**: the healthcare.gov, IRS and TurboTax links occasionally move. Click through them once a year.

## Deploying

Merging to `main` deploys the site automatically (`.github/workflows/deploy.yml`): it uploads the changed files over FTPS, then clears Cloudflare's copy of them. You can also run it by hand from the repo's **Actions** tab → **Deploy** → **Run workflow**.

It needs these repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | What it is |
| --- | --- |
| `FTP_SERVER` | Your FTP host from Network Solutions, e.g. `ftp.laurenhallden.com` |
| `FTP_USERNAME` | Your FTP username |
| `FTP_PASSWORD` | Your FTP password |
| `FTP_PATH` | The folder the calculator lives in, as your FTP manager shows it, ending in `/`, e.g. `/htdocs/therapycalculator/` |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with only the **Zone → Cache Purge** permission for laurenhallden.com |
| `CLOUDFLARE_ZONE_ID` | On the laurenhallden.com overview page in Cloudflare, bottom right |

The first run uploads everything; after that, only what changed.
