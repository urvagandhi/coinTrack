
---

## Account-Deletion Cascade (added 2026-08-23)

`listener/GoldSilverUserDataCleanupListener.java` listens for common's `UserDeletedEvent`
and deletes **all** gold/silver investments via the newly added
`GoldSilverInvestmentRepository.deleteByUserId(String)`. Deployment-wide metal rate
snapshots survive the deletion (not user-owned); metal rate settings are embedded in the
user document and go with it.
