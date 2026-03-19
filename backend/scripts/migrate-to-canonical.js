// MongoDB Migration Script: Cached Models → Canonical Models
// Run with: mongosh cointrack < migrate-to-canonical.js
// Or: mongosh "mongodb://localhost:27017/cointrack" migrate-to-canonical.js
//
// IMPORTANT: Take a backup before running this script!
// mongodump --db cointrack --out ./backup-before-canonical-migration

print("=== CoinTrack: Cached → Canonical Migration ===");
print("Started at: " + new Date().toISOString());

// ── Step 1: Rename Collections ──────────────────────────────────────────

function safeRename(oldName, newName) {
    if (db.getCollectionNames().includes(oldName)) {
        if (db.getCollectionNames().includes(newName)) {
            print("  WARNING: " + newName + " already exists. Dropping old " + newName + " first.");
            db.getCollection(newName).drop();
        }
        db.getCollection(oldName).renameCollection(newName);
        print("  Renamed: " + oldName + " → " + newName);
    } else {
        print("  SKIP: " + oldName + " does not exist");
    }
}

print("\n--- Step 1: Rename Collections ---");
safeRename("cached_holdings", "canonical_holdings");
safeRename("cached_positions", "canonical_positions");
safeRename("cached_funds", "canonical_funds");
safeRename("cached_mf_orders", "canonical_mf_orders");

// ── Step 2: Add brokerType field to all existing documents ──────────────
// Existing data is all from Zerodha (the only fully implemented broker)

print("\n--- Step 2: Add brokerType = 'ZERODHA' to all documents ---");

["canonical_holdings", "canonical_positions", "canonical_funds", "canonical_mf_orders"].forEach(function(coll) {
    if (db.getCollectionNames().includes(coll)) {
        var result = db.getCollection(coll).updateMany(
            { brokerType: { $exists: false } },
            { $set: { brokerType: "ZERODHA" } }
        );
        print("  " + coll + ": updated " + result.modifiedCount + " documents");
    }
});

// ── Step 3: Add dataSource = 'CACHED' to all documents ─────────────────

print("\n--- Step 3: Add dataSource = 'CACHED' to all documents ---");

["canonical_holdings", "canonical_positions"].forEach(function(coll) {
    if (db.getCollectionNames().includes(coll)) {
        var result = db.getCollection(coll).updateMany(
            { dataSource: { $exists: false } },
            { $set: { dataSource: "CACHED" } }
        );
        print("  " + coll + ": updated " + result.modifiedCount + " documents");
    }
});

// ── Step 4: Add dataConfidence = 'HIGH' to all holdings ─────────────────

print("\n--- Step 4: Add dataConfidence = 'HIGH' to holdings ---");

if (db.getCollectionNames().includes("canonical_holdings")) {
    var result = db.canonical_holdings.updateMany(
        { dataConfidence: { $exists: false } },
        { $set: { dataConfidence: "HIGH" } }
    );
    print("  canonical_holdings: updated " + result.modifiedCount + " documents");
}

// ── Step 5: Create Compound Unique Indexes ──────────────────────────────

print("\n--- Step 5: Create Compound Unique Indexes ---");

if (db.getCollectionNames().includes("canonical_holdings")) {
    db.canonical_holdings.createIndex(
        { userId: 1, brokerAccountId: 1, isin: 1 },
        { name: "idx_holding_unique", unique: true, background: true }
    );
    db.canonical_holdings.createIndex(
        { lastSyncedAt: 1 },
        { name: "idx_holding_last_synced", background: true }
    );
    print("  canonical_holdings: indexes created");
}

if (db.getCollectionNames().includes("canonical_positions")) {
    db.canonical_positions.createIndex(
        { userId: 1, brokerAccountId: 1, symbol: 1, instrumentType: 1 },
        { name: "idx_position_unique", unique: true, background: true }
    );
    print("  canonical_positions: indexes created");
}

if (db.getCollectionNames().includes("canonical_funds")) {
    db.canonical_funds.createIndex(
        { userId: 1, brokerAccountId: 1 },
        { name: "idx_funds_unique", unique: true, background: true }
    );
    print("  canonical_funds: indexes created");
}

if (db.getCollectionNames().includes("canonical_mf_orders")) {
    db.canonical_mf_orders.createIndex(
        { userId: 1, brokerAccountId: 1, orderId: 1 },
        { name: "idx_mf_order_unique", unique: true, background: true }
    );
    print("  canonical_mf_orders: indexes created");
}

// Create canonical_mf_holdings collection (new, didn't exist before)
if (!db.getCollectionNames().includes("canonical_mf_holdings")) {
    db.createCollection("canonical_mf_holdings");
    db.canonical_mf_holdings.createIndex(
        { userId: 1, brokerAccountId: 1, isin: 1 },
        { name: "idx_mf_holding_unique", unique: true, background: true }
    );
    print("  canonical_mf_holdings: collection and index created");
}

// ── Step 6: Verify ──────────────────────────────────────────────────────

print("\n--- Step 6: Verification ---");

["canonical_holdings", "canonical_positions", "canonical_funds", "canonical_mf_orders", "canonical_mf_holdings"].forEach(function(coll) {
    if (db.getCollectionNames().includes(coll)) {
        var count = db.getCollection(coll).countDocuments();
        var indexes = db.getCollection(coll).getIndexes();
        print("  " + coll + ": " + count + " documents, " + indexes.length + " indexes");
    } else {
        print("  " + coll + ": MISSING!");
    }
});

// Verify no old collections remain
["cached_holdings", "cached_positions", "cached_funds", "cached_mf_orders"].forEach(function(coll) {
    if (db.getCollectionNames().includes(coll)) {
        print("  WARNING: Old collection still exists: " + coll);
    }
});

print("\n=== Migration Complete ===");
print("Finished at: " + new Date().toISOString());
