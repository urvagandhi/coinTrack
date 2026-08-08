import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import { ObjectId } from 'mongodb';

async function main() {
    const { client, db } = await connectDB();
    const collection = db.collection('epf_transactions');

    try {
        const { action } = await inquirer.prompt([
            {
                type: 'select',
                name: 'action',
                message: 'What do you want to do with EPF?',
                choices: ['List all for a User', 'Add new EPF Transaction', 'Edit an EPF Transaction', 'Delete an EPF Transaction']
            }
        ]);

        if (action === 'List all for a User') {
            const { userId } = await inquirer.prompt([{ type: 'input', name: 'userId', message: 'Enter User ID:' }]);
            const docs = await collection.find({ userId: userId.trim() }).toArray();
            console.log(JSON.stringify(docs, null, 2));
        } else if (action === 'Add new EPF Transaction') {
            const { userId, employeeContribution, employerContribution, date } = await inquirer.prompt([
                { type: 'input', name: 'userId', message: 'User ID:' },
                { type: 'input', name: 'employeeContribution', message: 'Employee Contribution:' },
                { type: 'input', name: 'employerContribution', message: 'Employer Contribution:' },
                { type: 'input', name: 'date', message: 'Date (YYYY-MM-DD):' }
            ]);
            const newDoc = {
                userId: userId.trim(),
                employeeContribution: parseFloat(employeeContribution),
                employerContribution: parseFloat(employerContribution),
                date: new Date(date),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await collection.insertOne(newDoc);
            console.log(`Inserted with _id: ${result.insertedId}`);
        } else if (action === 'Edit an EPF Transaction') {
            const { docId, field, value } = await inquirer.prompt([
                { type: 'input', name: 'docId', message: 'Enter EPF _id:' },
                { type: 'input', name: 'field', message: 'Field to update:' },
                { type: 'input', name: 'value', message: 'New value:' }
            ]);
            let parsedValue = value;
            if (!isNaN(value) && value.trim() !== '') parsedValue = parseFloat(value);
            
            const query = ObjectId.isValid(docId) ? { _id: new ObjectId(docId.trim()) } : { _id: docId.trim() };
            const result = await collection.updateOne(query, { $set: { [field.trim()]: parsedValue, updatedAt: new Date() } });
            console.log(`Modified ${result.modifiedCount} document(s)`);
        } else if (action === 'Delete an EPF Transaction') {
            const { docId } = await inquirer.prompt([{ type: 'input', name: 'docId', message: 'Enter EPF _id to delete:' }]);
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
