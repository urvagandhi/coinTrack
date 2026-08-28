#!/usr/bin/env bash
# Data Migration Script for FD Module v1.3.0
# Backfills default values for new fields on existing Fixed Deposit documents
# Run this script after deploying v1.3.0 to ensure all existing FDs have proper defaults

set -e

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
DB_NAME="${DB_NAME:-coinTrack}"
COLLECTION="fixed_deposits"

echo "========================================"
echo "FD Module v1.3.0 Data Migration"
echo "========================================"
echo "MongoDB URI: $MONGO_URI"
echo "Database: $DB_NAME"
echo "Collection: $COLLECTION"
echo ""

# Check if mongo shell is available
if ! command -v mongosh &> /dev/null; then
    echo "ERROR: mongosh not found. Please install MongoDB Shell."
    exit 1
fi

# Execute migration
mongosh "$MONGO_URI/$DB_NAME" --quiet <<'EOF'
print("Starting FD data migration...");

// 1. Backfill FdType (default: CUMULATIVE)
var fdTypeResult = db.fixed_deposits.updateMany(
    { fdType: { $exists: false } },
    { $set: { fdType: "CUMULATIVE" } }
);
print("Updated " + fdTypeResult.modifiedCount + " documents with fdType=CUMULATIVE");

// 2. Backfill CompoundingFrequency (default: QUARTERLY)
var compoundingResult = db.fixed_deposits.updateMany(
    { compoundingFrequency: { $exists: false } },
    { $set: { compoundingFrequency: "QUARTERLY" } }
);
print("Updated " + compoundingResult.modifiedCount + " documents with compoundingFrequency=QUARTERLY");

// 3. Backfill PayoutFrequency (default: AT_MATURITY)
var payoutResult = db.fixed_deposits.updateMany(
    { payoutFrequency: { $exists: false } },
    { $set: { payoutFrequency: "AT_MATURITY" } }
);
print("Updated " + payoutResult.modifiedCount + " documents with payoutFrequency=AT_MATURITY");

// 4. Backfill isSeniorCitizen (default: false)
var seniorResult = db.fixed_deposits.updateMany(
    { isSeniorCitizen: { $exists: false } },
    { $set: { isSeniorCitizen: false } }
);
print("Updated " + seniorResult.modifiedCount + " documents with isSeniorCitizen=false");

// 5. Backfill isTaxSaver (default: false)
var taxSaverResult = db.fixed_deposits.updateMany(
    { isTaxSaver: { $exists: false } },
    { $set: { isTaxSaver: false } }
);
print("Updated " + taxSaverResult.modifiedCount + " documents with isTaxSaver=false");

// 6. Backfill taxSaverLockInYears (default: 5)
var lockInResult = db.fixed_deposits.updateMany(
    { taxSaverLockInYears: { $exists: false } },
    { $set: { taxSaverLockInYears: 5 } }
);
print("Updated " + lockInResult.modifiedCount + " documents with taxSaverLockInYears=5");

// 7. Backfill hasPan (default: true)
var panResult = db.fixed_deposits.updateMany(
    { hasPan: { $exists: false } },
    { $set: { hasPan: true } }
);
print("Updated " + panResult.modifiedCount + " documents with hasPan=true");

// 8. Backfill form15g15hSubmitted (default: false)
var form15Result = db.fixed_deposits.updateMany(
    { form15g15hSubmitted: { $exists: false } },
    { $set: { form15g15hSubmitted: false } }
);
print("Updated " + form15Result.modifiedCount + " documents with form15g15hSubmitted=false");

// 9. Backfill isPrematurelyWithdrawn (default: false)
var withdrawnResult = db.fixed_deposits.updateMany(
    { isPrematurelyWithdrawn: { $exists: false } },
    { $set: { isPrematurelyWithdrawn: false } }
);
print("Updated " + withdrawnResult.modifiedCount + " documents with isPrematurelyWithdrawn=false");

// 10. Backfill serverComputedMaturityAmount, maturityAmountOverridden, maturityDifference (default: null/false/0)
var validationResult = db.fixed_deposits.updateMany(
    { 
        $or: [
            { serverComputedMaturityAmount: { $exists: false } },
            { maturityAmountOverridden: { $exists: false } },
            { maturityDifference: { $exists: false } }
        ]
    },
    { 
        $set: { 
            serverComputedMaturityAmount: null,
            maturityAmountOverridden: false,
            maturityDifference: 0
        } 
    }
);
print("Updated " + validationResult.modifiedCount + " documents with server validation defaults");

// 11. Update status: any document with status=WITHDRAWN should be PREMATURELY_WITHDRAWN (legacy support)
var statusResult = db.fixed_deposits.updateMany(
    { status: "WITHDRAWN" },
    { $set: { status: "PREMATURELY_WITHDRAWN" } }
);
if (statusResult.modifiedCount > 0) {
    print("Migrated " + statusResult.modifiedCount + " legacy WITHDRAWN status to PREMATURELY_WITHDRAWN");
}

// Summary
var totalDocs = db.fixed_deposits.countDocuments({});
print("");
print("========================================");
print("Migration Complete");
print("========================================");
print("Total documents in collection: " + totalDocs);
print("");

EOF

echo "Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart the application to pick up new field defaults"
echo "2. Verify a few FDs in the UI to confirm fields are populated"
echo "3. Check application logs for any server-side validation warnings"