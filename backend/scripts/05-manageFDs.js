import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import { ObjectId } from 'mongodb';

async function main() {
    const { client, db } = await connectDB();
    const collection = db.collection('fixed_deposits');

    try {
        const { action } = await inquirer.prompt([
            {
                type: 'select',
                name: 'action',
                message: 'What do you want to do with Fixed Deposits?',
                choices: ['List all for a User', 'Add new FD', 'Edit an FD', 'Delete an FD']
            }
        ]);

        if (action === 'List all for a User') {
            const { userId } = await inquirer.prompt([{ type: 'input', name: 'userId', message: 'Enter User ID:' }]);
            const docs = await collection.find({ userId: userId.trim() }).toArray();
            console.log(JSON.stringify(docs, null, 2));
        } else if (action === 'Add new FD') {
            const { userId, bankName, amount, interestRate } = await inquirer.prompt([
                { type: 'input', name: 'userId', message: 'User ID:' },
                { type: 'input', name: 'bankName', message: 'Bank Name:' },
                { type: 'input', name: 'amount', message: 'Amount:' },
                { type: 'input', name: 'interestRate', message: 'Interest Rate (%):' }
            ]);
            const newDoc = {
                userId: userId.trim(),
                bankName: bankName.trim(),
                amount: parseFloat(amount),
                interestRate: parseFloat(interestRate),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await collection.insertOne(newDoc);
            console.log(`Inserted with _id: ${result.insertedId}`);
        } else if (action === 'Edit an FD') {
            const { docId, field, value } = await inquirer.prompt([
                { type: 'input', name: 'docId', message: 'Enter FD _id:' },
                { type: 'input', name: 'field', message: 'Field to update (e.g. amount):' },
                { type: 'input', name: 'value', message: 'New value:' }
            ]);
            let parsedValue = value;
            if (!isNaN(value) && value.trim() !== '') parsedValue = parseFloat(value);
            
            const query = ObjectId.isValid(docId) ? { _id: new ObjectId(docId.trim()) } : { _id: docId.trim() };
            const result = await collection.updateOne(query, { $set: { [field.trim()]: parsedValue, updatedAt: new Date() } });
            console.log(`Modified ${result.modifiedCount} document(s)`);
        } else if (action === 'Delete an FD') {
            const { docId } = await inquirer.prompt([{ type: 'input', name: 'docId', message: 'Enter FD _id to delete:' }]);
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
