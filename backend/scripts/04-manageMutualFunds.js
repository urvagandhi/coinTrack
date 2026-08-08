import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import { ObjectId } from 'mongodb';

async function main() {
    const { client, db } = await connectDB();

    try {
        const { collectionName } = await inquirer.prompt([
            {
                type: 'select',
                name: 'collectionName',
                message: 'Which Mutual Fund collection do you want to manage?',
                choices: [
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
                choices: ['List all for a User', `Add new record to ${collectionName}`, 'Edit a record', 'Delete a record']
            }
        ]);

        if (action === 'List all for a User') {
            const { userId } = await inquirer.prompt([{ type: 'input', name: 'userId', message: 'Enter User ID:' }]);
            const docs = await collection.find({ userId: userId.trim() }).toArray();
            console.log(JSON.stringify(docs, null, 2));
        } else if (action.startsWith('Add new')) {
            const { userId, schemeCode, amount, nav, units, date } = await inquirer.prompt([
                { type: 'input', name: 'userId', message: 'User ID:' },
                { type: 'input', name: 'schemeCode', message: 'Scheme Code:' },
                { type: 'input', name: 'amount', message: 'Amount:' },
                { type: 'input', name: 'nav', message: 'NAV (optional):' },
                { type: 'input', name: 'units', message: 'Units (optional):' },
                { type: 'input', name: 'date', message: 'Date (YYYY-MM-DD):' }
            ]);
            
            const newDoc = {
                userId: userId.trim(),
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
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await closeDB();
    }
}

main();
