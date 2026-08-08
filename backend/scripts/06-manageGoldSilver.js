import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import { ObjectId } from 'mongodb';

async function main() {
    const { client, db } = await connectDB();
    const collection = db.collection('gold_silver_investments');

    try {
        const { action } = await inquirer.prompt([
            {
                type: 'select',
                name: 'action',
                message: 'What do you want to do with Gold/Silver?',
                choices: ['List all for a User', 'Add new Investment', 'Edit an Investment', 'Delete an Investment']
            }
        ]);

        if (action === 'List all for a User') {
            const { userId } = await inquirer.prompt([{ type: 'input', name: 'userId', message: 'Enter User ID:' }]);
            const docs = await collection.find({ userId: userId.trim() }).toArray();
            console.log(JSON.stringify(docs, null, 2));
        } else if (action === 'Add new Investment') {
            const { userId, metalType, quantity, pricePerGram } = await inquirer.prompt([
                { type: 'input', name: 'userId', message: 'User ID:' },
                { type: 'select', name: 'metalType', message: 'Metal Type:', choices: ['GOLD', 'SILVER'] },
                { type: 'input', name: 'quantity', message: 'Quantity (grams):' },
                { type: 'input', name: 'pricePerGram', message: 'Price Per Gram:' }
            ]);
            const newDoc = {
                userId: userId.trim(),
                metalType: metalType.trim(),
                quantity: parseFloat(quantity),
                pricePerGram: parseFloat(pricePerGram),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await collection.insertOne(newDoc);
            console.log(`Inserted with _id: ${result.insertedId}`);
        } else if (action === 'Edit an Investment') {
            const { docId, field, value } = await inquirer.prompt([
                { type: 'input', name: 'docId', message: 'Enter Investment _id:' },
                { type: 'input', name: 'field', message: 'Field to update:' },
                { type: 'input', name: 'value', message: 'New value:' }
            ]);
            let parsedValue = value;
            if (!isNaN(value) && value.trim() !== '') parsedValue = parseFloat(value);
            
            const query = ObjectId.isValid(docId) ? { _id: new ObjectId(docId.trim()) } : { _id: docId.trim() };
            const result = await collection.updateOne(query, { $set: { [field.trim()]: parsedValue, updatedAt: new Date() } });
            console.log(`Modified ${result.modifiedCount} document(s)`);
        } else if (action === 'Delete an Investment') {
            const { docId } = await inquirer.prompt([{ type: 'input', name: 'docId', message: 'Enter Investment _id to delete:' }]);
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
