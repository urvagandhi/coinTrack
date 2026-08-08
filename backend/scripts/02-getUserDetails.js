import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';

async function main() {
    const { client, db } = await connectDB();

    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'userId',
                message: 'Enter the user ID (ObjectId format):',
                validate: (input) => input.trim() !== '' ? true : 'User ID cannot be empty'
            }
        ]);

        const userIdStr = answers.userId.trim();
        let userIdObj;
        
        // MongoDB uses ObjectId natively, but Spring Data MongoDB might store strings or ObjectIds.
        // Usually, in Spring it's a string mapped to ObjectId. Let's try to query with string first, then ObjectId.
        // Assuming string based on common Spring setups unless we encounter ObjectId.
        // To be safe, we query by both if it's a valid hex string.
        const query = { $or: [{ _id: userIdStr }, { id: userIdStr }] };
        
        // In case it's actually an ObjectId
        import('mongodb').then(async ({ ObjectId }) => {
            if (ObjectId.isValid(userIdStr)) {
                query.$or.push({ _id: new ObjectId(userIdStr) });
            }
            
            console.log(`\nFetching details for User ID: ${userIdStr}...\n`);
            
            const user = await db.collection('users').findOne(query);
            if (!user) {
                console.log('User not found.');
                await closeDB();
                return;
            }
            
            // For other collections, the reference is usually 'userId'
            const collectionsToSearch = [
                'broker_accounts',
                'mf_lumpsum_transactions',
                'mf_sip_contributions',
                'mf_sip_mandates',
                'mf_redemption_transactions',
                'fixed_deposits',
                'gold_silver_investments',
                'epf_transactions',
                'ppf_transactions',
                'notes'
            ];
            
            const results = {
                userProfile: user
            };
            
            for (const collName of collectionsToSearch) {
                const collection = db.collection(collName);
                const docs = await collection.find({ userId: userIdStr }).toArray();
                if (docs && docs.length > 0) {
                    results[collName] = docs;
                }
            }
            
            console.log('--- User Detailed Overview ---');
            console.log(JSON.stringify(results, null, 2));
            
            await closeDB();
        });
    } catch (error) {
        console.error('An error occurred:', error);
        await closeDB();
    }
}

main();
