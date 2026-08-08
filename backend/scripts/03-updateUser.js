import { connectDB, closeDB } from './db.js';
import inquirer from 'inquirer';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

async function main() {
    const { client, db } = await connectDB();
    const usersCollection = db.collection('users');

    try {
        const { userId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'userId',
                message: 'Enter the User ID (ObjectId or String) you want to update:',
                validate: (input) => input.trim() !== '' ? true : 'User ID cannot be empty'
            }
        ]);

        const userIdStr = userId.trim();
        const query = { $or: [{ _id: userIdStr }, { id: userIdStr }] };
        if (ObjectId.isValid(userIdStr)) {
            query.$or.push({ _id: new ObjectId(userIdStr) });
        }

        const user = await usersCollection.findOne(query);
        if (!user) {
            console.log('User not found.');
            await closeDB();
            return;
        }

        console.log(`\nFound User: ${user.username} (${user.email})\n`);

        const { updateAction } = await inquirer.prompt([
            {
                type: 'select',
                name: 'updateAction',
                message: 'What do you want to update/reset?',
                choices: [
                    'Update Email',
                    'Update Username',
                    'Update Phone Number',
                    'Reset Password',
                    'Reset TOTP (includes deleting backup codes)'
                ]
            }
        ]);

        let updateDoc = {};

        if (updateAction === 'Update Email') {
            const { newValue } = await inquirer.prompt([{ type: 'input', name: 'newValue', message: 'Enter new email:' }]);
            updateDoc = { $set: { email: newValue.trim() } };
        } else if (updateAction === 'Update Username') {
            const { newValue } = await inquirer.prompt([{ type: 'input', name: 'newValue', message: 'Enter new username:' }]);
            updateDoc = { $set: { username: newValue.trim() } };
        } else if (updateAction === 'Update Phone Number') {
            const { newValue } = await inquirer.prompt([{ type: 'input', name: 'newValue', message: 'Enter new phone number:' }]);
            updateDoc = { $set: { phoneNumber: newValue.trim() } };
        } else if (updateAction === 'Reset Password') {
            const { newValue } = await inquirer.prompt([{ type: 'password', name: 'newValue', message: 'Enter new password:' }]);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newValue, salt);
            updateDoc = { $set: { password: hashedPassword } };
        } else if (updateAction === 'Reset TOTP (includes deleting backup codes)') {
            updateDoc = { $unset: { totpSecret: "" }, $set: { totpEnabled: false } };
            
            // Delete backup codes from the backup_codes collection
            const backupCodesCollection = db.collection('backup_codes');
            const deleteResult = await backupCodesCollection.deleteMany({ userId: userIdStr });
            console.log(`Deleted ${deleteResult.deletedCount} backup codes for user.`);
        }

        if (Object.keys(updateDoc).length > 0) {
            const result = await usersCollection.updateOne({ _id: user._id }, updateDoc);
            if (result.modifiedCount > 0) {
                console.log(`\nSuccessfully applied "${updateAction}" to the user!`);
            } else {
                console.log('\nNo changes made (the new value might be identical to the old one).');
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await closeDB();
    }
}

main();
