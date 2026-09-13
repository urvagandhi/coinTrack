/**
 * ============================================================
 *  16-singleSchemeImporter.js
 *  Universal single-scheme backfill importer for coinTrack MF.
 *
 *  Mirrors the exact frontend → backend data flow:
 *    - AMFI official schemeName  (from mfapi.in /mf/<code>)
 *    - Bank full name            (from Razorpay banknames.json, same as BankSearchCombobox)
 *    - MF Category               (same autoExtractCategory() as NewSchemeModal.jsx)
 *    - Stamp Duty                (0.005% for dates >= 2020-07-01, matching LumpsumTransactionService)
 *    - debitedBank               (auto-set from scheme.bank, matching backend service)
 *    - applicableDate            (next business day from investmentDate, matching SettlementDateCalculator)
 *    - settlementDate            (T+1 by default, matching SettlementDateCalculator)
 *    - transactionNo             (resequenced globally for user after import)
 *    - gainType                  (user-provided per redemption: "LTCG" or "STCG")
 *
 *  USAGE:
 *    node 16-singleSchemeImporter.js
 *
 *  DATA INPUT:
 *    Edit the SCHEME_CONFIG and DATA sections below for each new scheme.
 *    Each run processes ONE scheme only (safe, easy to debug).
 * ============================================================
 */

import { connectDB, closeDB } from './db.js';

// ─────────────────────────────────────────────────────────────
//  SCHEME CONFIGURATION — Edit this for each new scheme
// ─────────────────────────────────────────────────────────────
const SCHEME_CONFIG = {
    userId: "6a635f3976973079b5c8ac5a",
    amfiCode: "122639",                        // AMFI code — schemeName will be fetched from API
    folioNo: "10757672",
    platform: "CAMS",                          // CAMS / Zerodha / Groww etc.
    holderName: "Krishil",                     // Name of the account holder
    bankCode: "SBIN",                          // Bank IFSC code prefix (SBIN, HDFC, ICIC, etc.)
};

// ─────────────────────────────────────────────────────────────
//  SIP PHASES — Each phase = one mandate
//  startDate: "DD.MM.YYYY" (first SIP date in this phase)
//  endDate:   "DD.MM.YYYY" (last SIP date in this phase, inclusive)
//  amount: in INR
//  sipDay: day of month for recurring deduction
// ─────────────────────────────────────────────────────────────
const SIP_PHASES = [
    {
        startDate: "05.07.2021",
        endDate:   "05.06.2024",
        amount: 3000,
        sipDay: 5
    },
    {
        startDate: "05.07.2024",
        endDate:   "05.08.2026",
        amount: 5000,
        sipDay: 5
    }
];

// ─────────────────────────────────────────────────────────────
//  LUMPSUM DATA
//  Format: { date, amount, units, nav, remarks }
//  NAV and units are from your records (manual override)
// ─────────────────────────────────────────────────────────────
const LUMPSUMS = [
    { date: "28.01.2021", amount: 5000, units: 132.941, nav: 37.6088, remarks: "" },
    { date: "07.05.2021", amount: 5000, units: 117.714, nav: 42.474, remarks: "" },
    { date: "19.07.2021", amount: 5000, units: 103.985, nav: 48.081, remarks: "" },
    { date: "07.12.2021", amount: 10000, units: 187.528, nav: 53.3228, remarks: "" },
    { date: "16.08.2024", amount: 2000, units: 23.701, nav: 84.3808, remarks: "Redemption from Mirae Asset Midcap Fund" },
    { date: "20.11.2025", amount: 30000, units: 318.893, nav: 94.0765, remarks: "Redemption from Parag Parekh Flexicap Fund  - 318.893 unit" },
    { date: "19.11.2025", amount: 10000, units: 106.0300, nav: 94.3086, remarks: "" },
    { date: "20.07.2026", amount: 100000, units: 1096.234, nav: 91.2168, remarks: "Redemption from Parag Parekh Flexicap Fund  - 1096.234 unit" },
    { date: "27.07.2026", amount: 100000, units: 1106.737, nav: 90.3512, remarks: "Redemption from Parag Parekh Flexicap Fund  - 1101.269  unit" }
];

// ─────────────────────────────────────────────────────────────
//  REDEMPTION DATA
//  gainType: "LTCG" or "STCG" (user-selected, not auto-computed)
//  redemptionValue: actual amount received / credited
//  capitalGain: explicitly provided (redemptionValue - tradeInvestmentValue)
// ─────────────────────────────────────────────────────────────
const REDEMPTIONS = [
    { 
        date: "20.11.2025", 
        totalUnit: 3448.19, redemptionUnit: 318.893, balanceUnit: 3129.297,
        totalInvestment: 220000, balanceInvestment: 206853, tradeInvestmentValue: 13147,
        redemptionValue: 30000, capitalGain: 16853, redemptionNav: 94.0765,
        gainType: "LTCG", remarks: "Reinvest in Parag Parekh Flexicap Fund (30000/-)" 
    },
    { 
        date: "20.07.2026", 
        totalUnit: 3991.1, redemptionUnit: 1096.3, balanceUnit: 2894.8,
        totalInvestment: 386853, balanceInvestment: 330641, tradeInvestmentValue: 56212,
        redemptionValue: 100000, capitalGain: 43788, redemptionNav: 91.2168,
        gainType: "LTCG", remarks: "Reinvest in Parag Parekh Flexi Cap Fund (100000/-)" 
    },
    { 
        date: "27.07.2026", 
        totalUnit: 3991.04, redemptionUnit: 1101.269, balanceUnit: 2889.771,
        totalInvestment: 430641, balanceInvestment: 362134, tradeInvestmentValue: 68507,
        redemptionValue: 99500, capitalGain: 30993, redemptionNav: 90.3512,
        gainType: "LTCG", remarks: "Reinvest in Parag Parekh Flexi Cap Fund (100000/-)" 
    }
];

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/** Parse DD.MM.YYYY → YYYY-MM-DD */
function parseDate(ddmmyyyy) {
    const [dd, mm, yyyy] = ddmmyyyy.split('.');
    return `${yyyy}-${mm}-${dd}`;
}

/** Convert YYYY-MM-DD → Date at midnight UTC (MongoDB LocalDate format) */
function toMongoDate(isoStr) {
    return new Date(`${isoStr}T00:00:00.000Z`);
}

/** Parse DD.MM.YYYY → MongoDB Date */
function parseDateToMongo(ddmmyyyy) {
    return toMongoDate(parseDate(ddmmyyyy));
}

function isBusinessDay(date) {
    const day = date.getUTCDay();
    return day !== 0 && day !== 6;
}

function getNextBusinessDay(date) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 1);
    while (!isBusinessDay(d)) d.setUTCDate(d.getUTCDate() + 1);
    return d;
}

/**
 * Mirrors SettlementDateCalculator.calculateApplicableDate()
 * isAfterCutoff=true → start from next business day
 * Non-business day → advance to next business day
 */
function calculateApplicableDate(investmentDate, isAfterCutoff = false) {
    let d = new Date(investmentDate);
    if (isAfterCutoff) d = getNextBusinessDay(d);
    if (!isBusinessDay(d)) d = getNextBusinessDay(d);
    return d;
}

/** Mirrors SettlementDateCalculator.calculateSettlementDate() — default T+1 */
function calculateSettlementDate(applicableDate) {
    return getNextBusinessDay(applicableDate);
}

/**
 * Mirrors LumpsumTransactionService stamp duty logic:
 * stampDutyRate = 0.005 (%) for dates >= 2020-07-01
 * stampDuty = amount × 0.005 / 100
 */
function computeStampDuty(amount, date) {
    const effectiveDate = new Date('2020-07-01T00:00:00.000Z');
    if (date >= effectiveDate) {
        const duty = parseFloat((amount * 0.005 / 100).toFixed(2));
        return { stampDutyRate: 0.005, stampDuty: duty };
    }
    return { stampDutyRate: 0, stampDuty: 0 };
}

/**
 * Mirrors NewSchemeModal.jsx autoExtractCategory()
 */
function autoExtractCategory(name) {
    if (!name) return "";
    const lower = name.toLowerCase();
    if (lower.includes('elss') || lower.includes('tax saver')) return 'ELSS';
    if (lower.includes('liquid')) return 'Liquid';
    if (lower.includes('flexi cap')) return 'Flexi Cap';
    if (lower.includes('small cap')) return 'Small Cap';
    if (lower.includes('mid cap') || lower.includes('midcap')) return 'Mid Cap';
    if (lower.includes('large cap') || lower.includes('bluechip')) return 'Large Cap';
    if (lower.includes('multi cap') || lower.includes('multicap')) return 'Multi Cap';
    if (lower.includes('index')) return 'Index Fund';
    if (lower.includes('arbitrage')) return 'Arbitrage';
    if (lower.includes('balanced') || lower.includes('advantage')) return 'Balanced Advantage';
    if (lower.includes('gilt')) return 'Gilt';
    if (lower.includes('gold')) return 'Gold ETF';
    if (lower.includes('silver')) return 'Silver ETF';
    if (lower.includes('overnight')) return 'Overnight';
    if (lower.includes('fund of fund') || lower.includes('fof')) return 'Fund of Funds';
    if (lower.includes('equity')) return 'Sectoral';
    if (lower.includes('debt') || lower.includes('bond')) return 'Corporate Bond';
    return "";
}

/** Fetch official AMFI scheme name + NAV history from mfapi.in */
async function fetchAmfiMeta(amfiCode) {
    console.log(`   📡 Fetching AMFI metadata for code: ${amfiCode} ...`);
    const res = await fetch(`https://api.mfapi.in/mf/${amfiCode}`);
    const data = await res.json();
    if (data.status !== 'SUCCESS') throw new Error(`MFAPI error for ${amfiCode}: ${JSON.stringify(data)}`);
    return {
        schemeName: data.meta.scheme_name,
        schemeCategory: data.meta.scheme_category,
        navHistory: data.data   // [{ date: "DD-MM-YYYY", nav: "..." }, ...]
    };
}

/**
 * Resolve bank full name from Razorpay banknames.json
 * Same source as BankSearchCombobox.jsx via /api/ifsc?type=all_banks
 */
async function resolveBankName(bankCode) {
    console.log(`   🏦 Resolving bank name for code: ${bankCode} ...`);
    const res = await fetch('https://raw.githubusercontent.com/razorpay/ifsc/master/src/banknames.json');
    const bankMap = await res.json();
    const name = bankMap[bankCode.toUpperCase()];
    if (!name) throw new Error(`Bank code "${bankCode}" not found`);
    console.log(`   ✅ ${bankCode} → "${name}"`);
    return name;
}

/**
 * Find NAV from mfapi navHistory for a given date (YYYY-MM-DD).
 * navHistory format: [{ date: "DD-MM-YYYY", nav: "37.6088" }]
 */
function findNavForDate(navHistory, isoDate) {
    const [yyyy, mm, dd] = isoDate.split('-');
    const apiStr = `${dd}-${mm}-${yyyy}`;
    const entry = navHistory.find(e => e.date === apiStr);
    return entry ? parseFloat(entry.nav) : null;
}

/** Generate monthly SIP dates between startDateStr and endDateStr on given sipDay */
function generateSipDates(startDateStr, endDateStr, sipDay) {
    const [sdd, smm, syyyy] = startDateStr.split('.');
    const [edd, emm, eyyyy] = endDateStr.split('.');
    const start = new Date(Date.UTC(+syyyy, +smm - 1, +sdd));
    const end   = new Date(Date.UTC(+eyyyy, +emm - 1, +edd));

    const dates = [];
    let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), sipDay));
    if (cur < start) cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, sipDay));

    while (cur <= end) {
        dates.push(new Date(cur));
        cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, sipDay));
    }
    return dates;
}

// ─────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
    const { db } = await connectDB();

    try {
        console.log('\n╔══════════════════════════════════════════════════════╗');
        console.log('║   16 — Single Scheme Backfill Importer              ║');
        console.log('╚══════════════════════════════════════════════════════╝\n');

        const { userId, amfiCode, folioNo, platform, holderName, bankCode } = SCHEME_CONFIG;

        // ── 1. Resolve external data ──────────────────────────────────
        console.log('🔍 Step 1: Resolving external data...');
        const amfiMeta = await fetchAmfiMeta(amfiCode);
        const bankFullName = await resolveBankName(bankCode);
        const mfCategory = autoExtractCategory(amfiMeta.schemeName);

        console.log(`\n   📋 Resolved:`);
        console.log(`      schemeName : ${amfiMeta.schemeName}`);
        console.log(`      mfCategory : ${mfCategory}`);
        console.log(`      bank       : ${bankFullName}`);

        // ── 2. Find or Create MF Scheme ───────────────────────────────
        console.log('\n📁 Step 2: Scheme...');
        const schemesCol = db.collection('mf_schemes');

        const existing = await schemesCol.findOne({ userId, amfiCode, folioNo });
        let schemeId;

        if (existing) {
            schemeId = existing._id.toString();
            console.log(`   ⚠️  Scheme already exists → using ID: ${schemeId}`);
        } else {
            const schemeDoc = {
                _class: "com.urva.myfinance.coinTrack.mutualfund.model.MfScheme",
                userId,
                holderName,
                amfiCode,
                schemeName: amfiMeta.schemeName,
                mfCategory,
                platform,
                folioNo,
                bank: bankFullName,
                statuses: [],  // Backend derives this dynamically via MfSchemeAggregationService
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const res = await schemesCol.insertOne(schemeDoc);
            schemeId = res.insertedId.toString();
            console.log(`   ✅ Created Scheme → ID: ${schemeId}`);
        }

        // ── 3. Lumpsum Transactions ───────────────────────────────────
        console.log(`\n💰 Step 3: Inserting ${LUMPSUMS.length} Lumpsums...`);
        const lsCol = db.collection('mf_lumpsum_transactions');

        for (const ls of LUMPSUMS) {
            const investmentDate = parseDateToMongo(ls.date);
            const applicableDate = calculateApplicableDate(investmentDate, false);
            const settlementDate = calculateSettlementDate(applicableDate);
            const { stampDutyRate, stampDuty } = computeStampDuty(ls.amount, investmentDate);

            const dup = await lsCol.findOne({ userId, schemeId, investmentDate, lumpsumInvestment: ls.amount });
            if (dup) {
                console.log(`   ⚠️  Dup lumpsum ${ls.date} ₹${ls.amount} — skipping`);
                continue;
            }

            await lsCol.insertOne({
                _class: "com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction",
                transactionNo: 0,
                userId,
                schemeId,
                investmentDate,
                lumpsumInvestment: ls.amount,
                totalUnit: ls.units,
                navPrice: ls.nav,
                isAfterCutoff: false,
                debitedBank: bankFullName,
                remarks: ls.remarks || "",
                stampDutyRate,
                stampDuty,
                status: "COMPLETED",
                applicableDate,
                settlementDate,
                retryCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`   ✅ ${ls.date}  ₹${ls.amount.toLocaleString('en-IN')}  @ NAV ${ls.nav}  = ${ls.units} units  [duty ₹${stampDuty}]`);
        }

        // ── 4. SIP Mandates + Contributions ──────────────────────────
        console.log(`\n📅 Step 4: SIP Mandates & Contributions...`);
        const mandatesCol = db.collection('mf_sip_mandates');
        const sipsCol = db.collection('mf_sip_contributions');

        for (const phase of SIP_PHASES) {
            console.log(`\n   Phase ₹${phase.amount} | ${phase.startDate} → ${phase.endDate}`);

            const phaseStart = parseDateToMongo(phase.startDate);

            let mandateId;
            const existingMandate = await mandatesCol.findOne({ userId, schemeId, startDate: phaseStart, amount: phase.amount });
            if (existingMandate) {
                mandateId = existingMandate._id.toString();
                console.log(`   ⚠️  Mandate exists → ID: ${mandateId}`);
            } else {
                const mandateDoc = {
                    _class: "com.urva.myfinance.coinTrack.mutualfund.model.SipMandate",
                    userId,
                    schemeId,
                    holderName,
                    startDate: phaseStart,
                    endDate: parseDateToMongo(phase.endDate),
                    amount: phase.amount,
                    bank: bankFullName,
                    // Auto-detect: if endDate is today or in the future → still active
                    active: parseDateToMongo(phase.endDate) >= new Date(new Date().toDateString()),
                    registrationNo: null,
                };
                const mRes = await mandatesCol.insertOne(mandateDoc);
                mandateId = mRes.insertedId.toString();
                console.log(`   ✅ Created Mandate → ID: ${mandateId}`);
            }

            const sipDates = generateSipDates(phase.startDate, phase.endDate, phase.sipDay);
            console.log(`   📆 ${sipDates.length} SIP dates to process`);

            let inserted = 0, skipped = 0, navMiss = 0;
            for (const sipDateRaw of sipDates) {
                // SIPs: isAfterCutoff=true (matches SipContributionService.createContribution())
                const applicableDate = calculateApplicableDate(sipDateRaw, true);
                const settlementDate = calculateSettlementDate(applicableDate);
                const appIso = applicableDate.toISOString().split('T')[0];

                let finalNav = findNavForDate(amfiMeta.navHistory, appIso);
                if (!finalNav) {
                    // Fallback: try the raw sipDate
                    const sipIso = sipDateRaw.toISOString().split('T')[0];
                    finalNav = findNavForDate(amfiMeta.navHistory, sipIso);
                }
                if (!finalNav) {
                    navMiss++;
                    console.log(`   ❌ No NAV for ${appIso} — skipping`);
                    continue;
                }

                const dup = await sipsCol.findOne({ userId, schemeId, sipMandateId: mandateId, contributionDate: sipDateRaw });
                if (dup) { skipped++; continue; }

                const { stampDutyRate, stampDuty } = computeStampDuty(phase.amount, sipDateRaw);
                const netInvestment = phase.amount - stampDuty;
                const totalUnit = parseFloat((netInvestment / finalNav).toFixed(4));

                await sipsCol.insertOne({
                    _class: "com.urva.myfinance.coinTrack.mutualfund.model.SipContribution",
                    transactionNo: 0,
                    userId,
                    sipMandateId: mandateId,
                    schemeId,
                    contributionDate: sipDateRaw,
                    amount: phase.amount,
                    navPrice: finalNav,
                    totalUnit,
                    debitedBank: bankFullName,
                    remarks: "",
                    stampDutyRate,
                    stampDuty,
                    status: "COMPLETED",
                    applicableDate,
                    settlementDate,
                    retryCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                inserted++;
            }
            console.log(`   ✅ Inserted: ${inserted}  Dup-skipped: ${skipped}  NAV-miss: ${navMiss}`);
        }

        // ── 5. Redemption Transactions ────────────────────────────────
        console.log(`\n🔄 Step 5: Inserting ${REDEMPTIONS.length} Redemptions...`);
        const redCol = db.collection('mf_redemption_transactions');

        for (const rd of REDEMPTIONS) {
            const redemptionDate = parseDateToMongo(rd.date);
            const applicableDate = calculateApplicableDate(redemptionDate, false);
            const settlementDate = calculateSettlementDate(applicableDate);
            const capitalGain = rd.capitalGain !== undefined
                ? rd.capitalGain
                : rd.redemptionValue - rd.tradeInvestmentValue;
            const netRedemptionValue = rd.redemptionValue - (rd.sttAmount || 0) - (rd.exitLoadDeducted || 0);

            const dup = await redCol.findOne({ userId, schemeId, redemptionDate, redemptionUnit: rd.redemptionUnit });
            if (dup) {
                console.log(`   ⚠️  Dup redemption ${rd.date} ${rd.redemptionUnit}u — skipping`);
                continue;
            }

            await redCol.insertOne({
                _class: "com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction",
                transactionNo: 0,
                userId,
                schemeId,
                redemptionDate,
                applicableDate,
                settlementDate,
                totalUnit: rd.totalUnit,
                redemptionUnit: rd.redemptionUnit,
                balanceUnit: rd.balanceUnit,
                totalInvestment: rd.totalInvestment,
                balanceInvestment: rd.balanceInvestment,
                tradeInvestmentValue: rd.tradeInvestmentValue,
                redemptionValue: rd.redemptionValue,
                netRedemptionValue,
                capitalGain,
                gainType: rd.gainType || "LTCG",
                redemptionNav: rd.redemptionNav,
                sttAmount: rd.sttAmount || 0,
                exitLoadDeducted: rd.exitLoadDeducted || 0,
                amountCreditedBank: bankFullName,
                status: "COMPLETED",
                isAfterCutoff: false,
                retryCount: 0,
                remarks: rd.remarks || "",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`   ✅ ${rd.date}  ${rd.redemptionUnit}u  @ ₹${rd.redemptionNav}  gain ₹${capitalGain} [${rd.gainType}]`);
        }

        // ── 6. Resequence all transactionNo for user ──────────────────
        console.log(`\n🔢 Step 6: Resequencing transactionNo for user...`);

        const allLumpsums = await lsCol.find({ userId }).sort({ investmentDate: 1, _id: 1 }).toArray();
        if (allLumpsums.length) {
            await lsCol.bulkWrite(allLumpsums.map((d, i) => ({
                updateOne: { filter: { _id: d._id }, update: { $set: { transactionNo: i + 1 } } }
            })));
            console.log(`   ✅ ${allLumpsums.length} lumpsums resequenced`);
        }

        const allSips = await sipsCol.find({ userId }).sort({ contributionDate: 1, _id: 1 }).toArray();
        if (allSips.length) {
            await sipsCol.bulkWrite(allSips.map((d, i) => ({
                updateOne: { filter: { _id: d._id }, update: { $set: { transactionNo: i + 1 } } }
            })));
            console.log(`   ✅ ${allSips.length} SIP contributions resequenced`);
        }

        const allReds = await redCol.find({ userId }).sort({ redemptionDate: 1, _id: 1 }).toArray();
        if (allReds.length) {
            await redCol.bulkWrite(allReds.map((d, i) => ({
                updateOne: { filter: { _id: d._id }, update: { $set: { transactionNo: i + 1 } } }
            })));
            console.log(`   ✅ ${allReds.length} redemptions resequenced`);
        }

        // ── 7. Trigger backend recalculation ─────────────────────────
        console.log(`\n⚡ Step 7: Triggering backend portfolio recalculation...`);
        try {
            const res = await fetch('http://localhost:8080/api/mutual-fund/admin/cleanup-investments');
            const result = await res.json();
            console.log(`   ✅ Backend says: ${result.message || JSON.stringify(result)}`);
        } catch {
            console.log(`   ⚠️  Backend unreachable — trigger manually:`);
            console.log(`      curl http://localhost:8080/api/mutual-fund/admin/cleanup-investments`);
        }

        // ── Summary ───────────────────────────────────────────────────
        console.log(`\n╔══════════════════════════════════════════════════════╗`);
        console.log(`║  ✅  IMPORT COMPLETE                                  ║`);
        console.log(`╚══════════════════════════════════════════════════════╝`);
        console.log(`   Scheme   : ${amfiMeta.schemeName}`);
        console.log(`   SchemeId : ${schemeId}`);
        console.log(`   Lumpsums : ${LUMPSUMS.length}`);
        console.log(`   SIP Phases: ${SIP_PHASES.length}`);
        console.log(`   Redemptions: ${REDEMPTIONS.length}`);
        console.log('');

    } catch (err) {
        console.error('\n❌ IMPORT FAILED:', err.message);
        console.error(err.stack);
    } finally {
        await closeDB();
    }
}

main();
