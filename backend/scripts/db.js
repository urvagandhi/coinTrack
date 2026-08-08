import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load the .env file from the backend root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined in ../.env');
    process.exit(1);
}

const client = new MongoClient(uri);

let isConnected = false;

export async function connectDB() {
    if (!isConnected) {
        try {
            await client.connect();
            isConnected = true;
            console.log('Connected to MongoDB successfully.');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    }
    
    // Fallback to 'Finance' if MONGODB_DB is not defined, or parsed from URI if possible
    const dbName = process.env.MONGODB_DB || 'Finance';
    return {
        client,
        db: client.db(dbName)
    };
}

export async function closeDB() {
    if (isConnected) {
        await client.close();
        isConnected = false;
        console.log('MongoDB connection closed.');
    }
}
