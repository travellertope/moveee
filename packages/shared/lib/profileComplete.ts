// Returns true if the logged-in user has both a display name and an avatar set.
// Used to soft-block reactions, comments, and new posts until the profile is complete.
// avatarUrl is stored on session.user (via the session callback's `s = session.user as any`),
// but some older code paths also checked session.avatarUrl (root) — check both to be safe.
export function isProfileComplete(session: any): boolean {
  if (!session) return false;
  const hasAvatar = !!(
    session.user?.avatarUrl ||
    session.avatarUrl ||
    session.user?.image
  );
  const hasName = !!(session.user?.name);
  return hasAvatar && hasName;
}
