import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import { ObjectId } from 'mongodb';

// --- HELPER FUNCTIONS FOR GUIDED WIZARD ---
async function fetchAmfiData(amfiCode) {
    try {
        console.log(`Fetching data for AMFI Code: ${amfiCode}...`);
        const response = await fetch(`https://api.mfapi.in/mf/${amfiCode}`);
        const data = await response.json();
        if (data.status !== 'SUCCESS') return null;
        return data;
    } catch (e) {
        console.error("Error fetching AMFI data:", e.message);
        return null;
    }
}

function parseDate(dateStr) {
    return new Date(dateStr);
}

function parseApiDate(apiDateStr) {
    const [dd, mm, yyyy] = apiDateStr.split('-');
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
}

function findNavForDate(apiData, targetDateStr) {
    if (!apiData || !apiData.data) return null;
    const targetDate = parseDate(targetDateStr);
    
    // API data is usually newest first. We sort oldest first to find the NEXT business day.
    const sortedData = [...apiData.data].sort((a, b) => parseApiDate(a.date) - parseApiDate(b.date));
    
    for (const record of sortedData) {
        const recordDate = parseApiDate(record.date);
        if (recordDate >= targetDate) {
            return {
                nav: parseFloat(record.nav),
                actualDate: recordDate
            };
        }
    }
    return null;
}

function generateTransactionNo() {
    return Math.floor(Math.random() * 1000000000000);
}

async function handleLumpsum(db, userId, schemeId, amfiData) {
    const collection = db.collection('mf_lumpsum_transactions');
    const answers = await inquirer.prompt([
        { type: 'input', name: 'date', message: 'Investment Date (YYYY-MM-DD):' },
        { type: 'input', name: 'amount', message: 'Amount:' },
        { type: 'input', name: 'nav', message: 'NAV (leave empty to auto-fetch):' },
        { type: 'input', name: 'units', message: 'Units (leave empty to auto-calculate):' },
        { type: 'input', name: 'bank', message: 'Debited Bank (optional):' },
    ]);

    let finalDate = parseDate(answers.date);
    let nav = parseFloat(answers.nav);
    
    if (isNaN(nav)) {
        const navResult = findNavForDate(amfiData, answers.date);
        if (navResult === null) {
            console.log("Could not find NAV for this date from AMFI. Please enter manually next time.");
            return;
        }
        nav = navResult.nav;
        if (navResult.actualDate.getTime() !== finalDate.getTime()) {
            console.log(`⏩ Rolled forward to next business day: ${navResult.actualDate.toISOString().split('T')[0]}`);
            finalDate = navResult.actualDate;
        }
        console.log(`Auto-fetched NAV: ${nav}`);
    }

    let amount = parseFloat(answers.amount);
    let units = parseFloat(answers.units);
    if (isNaN(units)) {
        units = parseFloat((amount / nav).toFixed(4));
        console.log(`Auto-calculated Units: ${units}`);
    } else if (isNaN(amount) && !isNaN(units)) {
        amount = parseFloat((units * nav).toFixed(2));
        console.log(`Auto-calculated Amount: ${amount}`);
    }

    const doc = {
        _class: "com.urva.myfinance.coinTrack.mutualfund.model.LumpsumTransaction",
        transactionNo: generateTransactionNo(),
        userId: new ObjectId(userId),
        schemeId: schemeId, // strictly ObjectId
        investmentDate: finalDate,
        lumpsumInvestment: amount,
        totalUnit: units,
        navPrice: nav,
        debitedBank: answers.bank || null,
        status: "SETTLED",
        stampDutyRate: 0.005,
        stampDuty: parseFloat((amount * 0.00005).toFixed(2)),
        isAfterCutoff: false,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const res = await collection.insertOne(doc);
    console.log(`✅ Lumpsum added with ID: ${res.insertedId}`);
}

async function handleSipMandate(db, userId, schemeId) {
    const collection = db.collection('mf_sip_mandates');
    const answers = await inquirer.prompt([
        { type: 'input', name: 'startDate', message: 'Start Date (YYYY-MM-DD):' },
        { type: 'input', name: 'amount', message: 'SIP Amount:' },
        { type: 'input', name: 'bank', message: 'Bank:' },
    ]);

    const doc = {
        _class: "com.urva.myfinance.coinTrack.mutualfund.model.SipMandate",
        userId: new ObjectId(userId),
        schemeId: schemeId, // strictly ObjectId
        startDate: parseDate(answers.startDate),
        amount: parseFloat(answers.amount),
        bank: answers.bank,
        active: true
    };

    const res = await collection.insertOne(doc);
    console.log(`✅ SIP Mandate added with ID: ${res.insertedId}`);
    return res.insertedId;
}

async function handleSipContribution(db, userId, schemeId, mandateId, amfiData) {
    const collection = db.collection('mf_sip_contributions');
    const answers = await inquirer.prompt([
        { type: 'input', name: 'date', message: 'Contribution Date (YYYY-MM-DD):' },
        { type: 'input', name: 'amount', message: 'Amount:' },
        { type: 'input', name: 'nav', message: 'NAV (leave empty to auto-fetch):' },
        { type: 'input', name: 'units', message: 'Units (leave empty to auto-calculate):' }
    ]);

    let finalDate = parseDate(answers.date);
    let nav = parseFloat(answers.nav);
    
    if (isNaN(nav)) {
        const navResult = findNavForDate(amfiData, answers.date);
        if (navResult === null) {
            console.log("Could not find NAV for this date from AMFI.");
            return;
        }
        nav = navResult.nav;
        if (navResult.actualDate.getTime() !== finalDate.getTime()) {
            console.log(`⏩ Rolled forward to next business day: ${navResult.actualDate.toISOString().split('T')[0]}`);
            finalDate = navResult.actualDate;
        }
        console.log(`Auto-fetched NAV: ${nav}`);
    }

    let amount = parseFloat(answers.amount);
    let units = parseFloat(answers.units);
    if (isNaN(units)) {
        units = parseFloat((amount / nav).toFixed(4));
        console.log(`Auto-calculated Units: ${units}`);
    }

    const doc = {
        _class: "com.urva.myfinance.coinTrack.mutualfund.model.SipContribution",
        transactionNo: generateTransactionNo(),
        userId: new ObjectId(userId),
        sipMandateId: mandateId, // strictly ObjectId
        schemeId: schemeId, // strictly ObjectId
        contributionDate: finalDate,
        amount: amount,
        navPrice: nav,
        totalUnit: units,
        status: "SETTLED",
        stampDutyRate: 0.005,
        stampDuty: parseFloat((amount * 0.00005).toFixed(2)),
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const res = await collection.insertOne(doc);
    console.log(`✅ SIP Contribution added with ID: ${res.insertedId}`);
}

async function handleRedemption(db, userId, schemeId, amfiData) {
    const collection = db.collection('mf_redemption_transactions');
    const answers = await inquirer.prompt([
        { type: 'input', name: 'date', message: 'Redemption Date (YYYY-MM-DD):' },
        { type: 'input', name: 'units', message: 'Redeemed Units:' },
        { type: 'input', name: 'nav', message: 'Redemption NAV (leave empty to auto-fetch):' },
    ]);

    let finalDate = parseDate(answers.date);
    let nav = parseFloat(answers.nav);
    
    if (isNaN(nav)) {
        const navResult = findNavForDate(amfiData, answers.date);
        if (navResult === null) {
            console.log("Could not find NAV for this date from AMFI.");
            return;
        }
        nav = navResult.nav;
        if (navResult.actualDate.getTime() !== finalDate.getTime()) {
            console.log(`⏩ Rolled forward to next business day: ${navResult.actualDate.toISOString().split('T')[0]}`);
            finalDate = navResult.actualDate;
        }
        console.log(`Auto-fetched NAV: ${nav}`);
    }

    let units = parseFloat(answers.units);
    let redemptionValue = parseFloat((units * nav).toFixed(2));
    console.log(`Calculated Redemption Value: ${redemptionValue}`);

    const doc = {
        _class: "com.urva.myfinance.coinTrack.mutualfund.model.RedemptionTransaction",
        transactionNo: generateTransactionNo(),
        userId: new ObjectId(userId),
        schemeId: schemeId, // strictly ObjectId
        redemptionDate: finalDate,
        redemptionUnit: units,
        redemptionNav: nav,
        redemptionValue: redemptionValue,
        netRedemptionValue: redemptionValue,
        status: "SETTLED",
        retryCount: 0,
        createdAt: new Date()
    };

    const res = await collection.insertOne(doc);
    console.log(`✅ Redemption added with ID: ${res.insertedId}`);
}

// --- GUIDED WIZARD MAIN FUNCTION ---
async function runGuidedWizard(db) {
    console.log('\n--- Guided AMFI Setup Wizard ---');
    const { userId } = await inquirer.prompt([
        { type: 'input', name: 'userId', message: 'Enter User ID to manage data for:' }
    ]);

    let continueOuter = true;
    while (continueOuter) {
        console.log('\n--- New Scheme Setup ---');
        const { amfiCode } = await inquirer.prompt([
            { type: 'input', name: 'amfiCode', message: 'Enter AMFI Code (or leave blank to exit):' }
        ]);

        if (!amfiCode || amfiCode.trim() === '') break;

        const amfiData = await fetchAmfiData(amfiCode.trim());
        if (!amfiData) {
            console.log("❌ Could not fetch data for this AMFI code. Try again.");
            continue;
        }

        console.log(`\nFound Scheme: ${amfiData.meta.scheme_name}`);
        console.log(`Category: ${amfiData.meta.scheme_category}`);

        const schemeInfo = await inquirer.prompt([
            { type: 'input', name: 'holderName', message: 'Holder Name (e.g. Krishil Gandhi):' },
            { type: 'input', name: 'folioNo', message: 'Folio Number:' },
            { type: 'input', name: 'platform', message: 'Platform (e.g., Coin, Groww):', default: 'Coin' },
            { type: 'input', name: 'bank', message: 'Bank Name:' },
        ]);

        const schemesCol = db.collection('mf_schemes');
        const userObjId = new ObjectId(userId);
        
        let schemeDoc = {
            _class: "com.urva.myfinance.coinTrack.mutualfund.model.MfScheme",
            userId: userObjId,
            holderName: schemeInfo.holderName,
            amfiCode: amfiCode.trim(),
            schemeName: amfiData.meta.scheme_name,
            mfCategory: amfiData.meta.scheme_category,
            folioNo: schemeInfo.folioNo,
            platform: schemeInfo.platform,
            bank: schemeInfo.bank,
            statuses: ['ACTIVE'],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        let existingScheme = await schemesCol.findOne({
            userId: userObjId, 
            schemeName: schemeDoc.schemeName, 
            folioNo: schemeDoc.folioNo, 
            platform: schemeDoc.platform
        });

        let schemeId;
        if (existingScheme) {
            console.log(`Scheme already exists with ID: ${existingScheme._id}`);
            schemeId = existingScheme._id;
        } else {
            const res = await schemesCol.insertOne(schemeDoc);
            schemeId = res.insertedId;
            console.log(`✅ Scheme created with ID: ${schemeId}`);
        }

        let currentMandateId = null;
        let continueInner = true;
        while (continueInner) {
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: `\nWhat would you like to add for '${amfiData.meta.scheme_name}'?`,
                    choices: [
                        'Add Lumpsum',
                        'Create SIP Mandate',
                        'Add SIP Contribution',
                        'Add Redemption',
                        'Done with this Scheme'
                    ]
                }
            ]);

            if (action === 'Add Lumpsum') {
                await handleLumpsum(db, userId, schemeId, amfiData);
            } else if (action === 'Create SIP Mandate') {
                currentMandateId = await handleSipMandate(db, userId, schemeId);
            } else if (action === 'Add SIP Contribution') {
                if (!currentMandateId) {
                    console.log("⚠️ You must create a SIP Mandate first before adding contributions!");
                } else {
                    await handleSipContribution(db, userId, schemeId, currentMandateId, amfiData);
                }
            } else if (action === 'Add Redemption') {
                await handleRedemption(db, userId, schemeId, amfiData);
            } else {
                continueInner = false;
            }
        }
    }
}


// --- MAIN CLI MENU ---
async function main() {
    const { client, db } = await connectDB();

    try {
        console.log('\n--- The Ultimate Mutual Fund CLI Manager ---\n');
        
        const { mainAction } = await inquirer.prompt([
            {
                type: 'list',
                name: 'mainAction',
                message: 'What would you like to do?',
                choices: [
                    'Guided Setup Wizard (AMFI Lookup for Scheme/SIP/Lumpsum/Redemption)',
                    'Manage Raw Collections (List / Add / Edit / Delete)',
                    'Exit'
                ]
            }
        ]);

        if (mainAction === 'Exit') {
            return;
        }

        if (mainAction === 'Guided Setup Wizard (AMFI Lookup for Scheme/SIP/Lumpsum/Redemption)') {
            await runGuidedWizard(db);
        } else {
            // Raw generic mode
            const { collectionName } = await inquirer.prompt([
                {
                    type: 'select',
                    name: 'collectionName',
                    message: 'Which Mutual Fund collection do you want to manage?',
                    choices: [
                        'mf_schemes',
                        'mf_lumpsum_transactions',
                        'mf_sip_contributions',
                        'mf_sip_mandates',
                        'mf_redemption_transactions'
                    ]
                }
            ]);

            const collection = db.collection(collectionName);

            const { action } = await inquirer.prompt([
                {
                    type: 'select',
                    name: 'action',
                    message: `What do you want to do with ${collectionName}?`,
                    choices: ['List all for a User', `Add generic record to ${collectionName}`, 'Edit a record', 'Delete a record']
                }
            ]);

            if (action === 'List all for a User') {
                const { userId } = await inquirer.prompt([{ type: 'input', name: 'userId', message: 'Enter User ID:' }]);
                const queryUserId = ObjectId.isValid(userId) ? new ObjectId(userId.trim()) : userId.trim();
                const docs = await collection.find({ userId: queryUserId }).toArray();
                console.log(JSON.stringify(docs, null, 2));
                
            } else if (action.startsWith('Add generic record')) {
                console.log("⚠️ Note: Using Guided Wizard is highly recommended instead of generic add.");
                const { userId, schemeCode, amount, nav, units, date } = await inquirer.prompt([
                    { type: 'input', name: 'userId', message: 'User ID:' },
                    { type: 'input', name: 'schemeCode', message: 'Scheme Code:' },
                    { type: 'input', name: 'amount', message: 'Amount:' },
                    { type: 'input', name: 'nav', message: 'NAV (optional):' },
                    { type: 'input', name: 'units', message: 'Units (optional):' },
                    { type: 'input', name: 'date', message: 'Date (YYYY-MM-DD):' }
                ]);
                
                const newDoc = {
                    userId: ObjectId.isValid(userId.trim()) ? new ObjectId(userId.trim()) : userId.trim(),
                    schemeCode: schemeCode.trim(),
                    amount: parseFloat(amount),
                    date: new Date(date),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                if (nav) newDoc.nav = parseFloat(nav);
                if (units) newDoc.units = parseFloat(units);
                
                const result = await collection.insertOne(newDoc);
                console.log(`Inserted with _id: ${result.insertedId}`);
                
            } else if (action === 'Edit a record') {
                const { docId, field, value } = await inquirer.prompt([
                    { type: 'input', name: 'docId', message: 'Enter record _id:' },
                    { type: 'input', name: 'field', message: 'Field to update:' },
                    { type: 'input', name: 'value', message: 'New value:' }
                ]);
                let parsedValue = value;
                if (value.toLowerCase() === 'true') parsedValue = true;
                else if (value.toLowerCase() === 'false') parsedValue = false;
                else if (!isNaN(value) && value.trim() !== '') parsedValue = parseFloat(value);
                
                const query = ObjectId.isValid(docId) ? { _id: new ObjectId(docId.trim()) } : { _id: docId.trim() };
                const result = await collection.updateOne(query, { $set: { [field.trim()]: parsedValue, updatedAt: new Date() } });
                console.log(`Modified ${result.modifiedCount} document(s)`);
                
            } else if (action === 'Delete a record') {
                const { docId } = await inquirer.prompt([{ type: 'input', name: 'docId', message: 'Enter record _id to delete:' }]);
                const query = ObjectId.isValid(docId) ? { _id: new ObjectId(docId.trim()) } : { _id: docId.trim() };
                const result = await collection.deleteOne(query);
                console.log(`Deleted ${result.deletedCount} document(s)`);
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await closeDB();
    }
}

main();
