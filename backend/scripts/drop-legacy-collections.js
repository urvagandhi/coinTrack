// ============================================================================
// CoinTrack — Drop Legacy MongoDB Collections
// Run once against MongoDB Atlas:
//   mongosh "mongodb+srv://..." --file drop-legacy-collections.js
// ============================================================================

// database_sequences: legacy auto-increment IDs, replaced by MongoDB ObjectId
if (db.getCollectionNames().includes("database_sequences")) {
    db.database_sequences.drop();
    print("Dropped database_sequences collection (legacy, replaced by MongoDB ObjectId)");
} else {
    print("database_sequences collection does not exist — already cleaned up");
}

// Verify remaining collections
print("\nRemaining collections: " + db.getCollectionNames().join(", "));
