// TOTP Reset Script for CoinTrack
// Run this in MongoDB shell or MongoDB Compass to reset 2FA for a user

// ============================================
// OPTION 1: Reset by Username
// ============================================
db.users.updateOne(
    { username: "urva_gandhi" },
    {
        $set: {
            totpEnabled: false,
            totpVerified: false,
            totpSecretEncrypted: null,
            totpSecretPending: null,
            totpSecretVersion: 0,
            totpSetupAt: null,
            totpLastUsedAt: null,
            totpFailedAttempts: 0,
            totpLockedUntil: null
        }
    }
);

// Delete backup codes for this user
db.backupCodes.deleteMany({ userId: db.users.findOne({ username: "urva_gandhi" })._id.toString() });

// ============================================
// OPTION 2: Reset by Email
// ============================================
// db.users.updateOne(
//     { email: "your@email.com" },
//     {
//         $set: {
//             totpEnabled: false,
//             totpVerified: false,
//             totpSecretEncrypted: null,
//             totpSecretPending: null,
//             totpSecretVersion: 0,
//             totpSetupAt: null,
//             totpLastUsedAt: null,
//             totpFailedAttempts: 0,
//             totpLockedUntil: null
//         }
//     }
// );

// ============================================
// OPTION 3: Reset ALL users (development only!)
// ============================================
// db.users.updateMany(
//     {},
//     {
//         $set: {
//             totpEnabled: false,
//             totpVerified: false,
//             totpSecretEncrypted: null,
//             totpSecretPending: null,
//             totpSecretVersion: 0,
//             totpSetupAt: null,
//             totpLastUsedAt: null,
//             totpFailedAttempts: 0,
//             totpLockedUntil: null
//         }
//     }
// );
// db.backupCodes.deleteMany({});

console.log("✅ TOTP Reset Complete! User can now set up 2FA again.");
