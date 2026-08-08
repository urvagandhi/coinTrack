import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';

async function main() {
    const { client, db } = await connectDB();
    const usersCollection = db.collection('users');

    try {
        const answers = await inquirer.prompt([
            {
                type: 'select',
                name: 'searchBy',
                message: 'How would you like to find the user?',
                choices: ['email', 'username']
            },
            {
                type: 'input',
                name: 'searchValue',
                message: 'Enter the value to search for:',
                validate: (input) => input.trim() !== '' ? true : 'Value cannot be empty'
            }
        ]);

        const query = {};
        query[answers.searchBy] = answers.searchValue.trim();

        console.log(`Searching for user with ${answers.searchBy} = ${answers.searchValue.trim()}...`);
        const user = await usersCollection.findOne(query);

        if (user) {
            console.log('\n--- User Found ---');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('\nUser not found.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await closeDB();
    }
}

main();
