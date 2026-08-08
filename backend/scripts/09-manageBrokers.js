import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import { ObjectId } from 'mongodb';

async function main() {
    const { client, db } = await connectDB();
    const collection = db.collection('broker_accounts');

    try {
        const { action } = await inquirer.prompt([
            {
                type: 'select',
                name: 'action',
                message: 'What do you want to do with Broker Accounts?',
                choices: ['List all for a User', 'Add new Broker Account', 'Edit a Broker Account', 'Delete a Broker Account']
            }
        ]);

        if (action === 'List all for a User') {
            const { userId } = await inquirer.prompt([{ type: 'input', name: 'userId', message: 'Enter User ID:' }]);
            const docs = await collection.find({ userId: userId.trim() }).toArray();
            console.log(JSON.stringify(docs, null, 2));
        } else if (action === 'Add new Broker Account') {
            const { userId, brokerName, clientId, apiKey, apiSecret, pin } = await inquirer.prompt([
                { type: 'input', name: 'userId', message: 'User ID:' },
                { type: 'select', name: 'brokerName', message: 'Broker Name:', choices: ['ZERODHA', 'UPSTOX', 'ANGELONE'] },
                { type: 'input', name: 'clientId', message: 'Client ID:' },
                { type: 'input', name: 'apiKey', message: 'API Key (optional):' },
                { type: 'password', name: 'apiSecret', message: 'API Secret (optional):' },
                { type: 'password', name: 'pin', message: 'PIN (optional):' }
            ]);
            const newDoc = {
                userId: userId.trim(),
                brokerName: brokerName.trim(),
                clientId: clientId.trim(),
                apiKey: apiKey.trim() || null,
                apiSecret: apiSecret.trim() || null,
                pin: pin.trim() || null,
                connected: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await collection.insertOne(newDoc);
            console.log(`Inserted with _id: ${result.insertedId}`);
        } else if (action === 'Edit a Broker Account') {
            const { docId, field, value } = await inquirer.prompt([
                { type: 'input', name: 'docId', message: 'Enter Broker Account _id:' },
                { type: 'input', name: 'field', message: 'Field to update (e.g. apiKey, apiSecret, connected):' },
                { type: 'input', name: 'value', message: 'New value (true/false for connected):' }
            ]);
            let parsedValue = value;
            if (value.toLowerCase() === 'true') parsedValue = true;
            else if (value.toLowerCase() === 'false') parsedValue = false;
            else if (!isNaN(value) && value.trim() !== '') parsedValue = parseFloat(value);
            
            const query = ObjectId.isValid(docId) ? { _id: new ObjectId(docId.trim()) } : { _id: docId.trim() };
            const result = await collection.updateOne(query, { $set: { [field.trim()]: parsedValue, updatedAt: new Date() } });
            console.log(`Modified ${result.modifiedCount} document(s)`);
        } else if (action === 'Delete a Broker Account') {
            const { docId } = await inquirer.prompt([{ type: 'input', name: 'docId', message: 'Enter Broker Account _id to delete:' }]);
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
