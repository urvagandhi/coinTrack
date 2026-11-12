import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'Finance');
    const targetUserId = "6a635f3976973079b5c8ac5a";
    console.log(`Deleting all mutual fund data for user: ${targetUserId}...`);

    await db.collection('mf_lumpsum_transactions').deleteMany({ userId: targetUserId });
    await db.collection('mf_sip_contributions').deleteMany({ userId: targetUserId });
    await db.collection('mf_redemption_transactions').deleteMany({ userId: targetUserId });
    await db.collection('mf_sip_mandates').deleteMany({ userId: targetUserId });
    await db.collection('mf_portfolio_holdings').deleteMany({ userId: targetUserId });
    await db.collection('mf_schemes').deleteMany({ userId: targetUserId });
    
    console.log("✅ All Data cleared successfully.");
    
    await client.close();
}

main().catch(console.error);
