/**
 * User Entity Model
 * Represents the normalized authenticated user session identity.
 */
export const createUserModel = (rawUser = {}) => ({
  id: rawUser.id || rawUser.userId || null,
  email: rawUser.email || '',
  name: rawUser.name || rawUser.fullName || '',
  username: rawUser.username || '',
  role: rawUser.role || 'USER',
  tier: rawUser.tier || 'FREE',
  isEmailVerified: Boolean(rawUser.isEmailVerified ?? rawUser.emailVerified),
  is2faEnabled: Boolean(rawUser.is2faEnabled ?? rawUser.totpEnabled),
  avatarUrl: rawUser.avatarUrl || null,
  createdAt: rawUser.createdAt || null,
});
