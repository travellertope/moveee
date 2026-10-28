// Returns true if the logged-in user has both a display name and an avatar set.
// Used to soft-block reactions, comments, and new posts until the profile is complete.
// avatarUrl lives on the session root (not session.user) because NextAuth doesn't
// natively support it — the session callback casts it with `as any`.
export function isProfileComplete(session: any): boolean {
  if (!session) return false;
  const hasAvatar = !!(session.avatarUrl || session.user?.image);
  const hasName   = !!(session.user?.name);
  return hasAvatar && hasName;
}
