package com.urva.myfinance.coinTrack.common.event;

/**
 * Published by the user module after a user account document has been deleted. Each owning module
 * listens for this event and cleans up its own user-keyed data, keeping the dependency direction
 * clean (modules depend on common only).
 */
public record UserDeletedEvent(String userId, String username) {}
