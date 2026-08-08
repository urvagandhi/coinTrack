import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import { ObjectId } from 'mongodb';

async function main() {
    const { client, db } = await connectDB();
    const collection = db.collection('ppf_transactions');

    try {
        const { action } = await inquirer.prompt([
            {
                type: 'select',
                name: 'action',
                message: 'What do you want to do with PPF?',
                choices: ['List all for a User', 'Add new PPF Transaction', 'Edit a PPF Transaction', 'Delete a PPF Transaction']
            }
        ]);

        if (action === 'List all for a User') {
            const { userId } = await inquirer.prompt([{ type: 'input', name: 'userId', message: 'Enter User ID:' }]);
            const docs = await collection.find({ userId: userId.trim() }).toArray();
            console.log(JSON.stringify(docs, null, 2));
        } else if (action === 'Add new PPF Transaction') {
            const { userId, amount, date } = await inquirer.prompt([
                { type: 'input', name: 'userId', message: 'User ID:' },
                { type: 'input', name: 'amount', message: 'Amount:' },
                { type: 'input', name: 'date', message: 'Date (YYYY-MM-DD):' }
            ]);
            const newDoc = {
                userId: userId.trim(),
                amount: parseFloat(amount),
                date: new Date(date),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await collection.insertOne(newDoc);
            console.log(`Inserted with _id: ${result.insertedId}`);
        } else if (action === 'Edit a PPF Transaction') {
            const { docId, field, value } = await inquirer.prompt([
                { type: 'input', name: 'docId', message: 'Enter PPF _id:' },
                { type: 'input', name: 'field', message: 'Field to update:' },
                { type: 'input', name: 'value', message: 'New value:' }
            ]);
            let parsedValue = value;
            if (!isNaN(value) && value.trim() !== '') parsedValue = parseFloat(value);
            
            const query = ObjectId.isValid(docId) ? { _id: new ObjectId(docId.trim()) } : { _id: docId.trim() };
            const result = await collection.updateOne(query, { $set: { [field.trim()]: parsedValue, updatedAt: new Date() } });
            console.log(`Modified ${result.modifiedCount} document(s)`);
        } else if (action === 'Delete a PPF Transaction') {
            const { docId } = await inquirer.prompt([{ type: 'input', name: 'docId', message: 'Enter PPF _id to delete:' }]);
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
