// Deterministic gradient identity per Hub (hashed from its id) — every Hub
// gets a real visual even with no cover image, instead of a flat grey
// placeholder. Mirrors the same "hash-based avatar color" idea used for
// member avatars on web (MemberDirectory.tsx). Shared by HubDetailScreen.tsx
// and HubsScreen.tsx — keep this the one place either screen reads from, so
// a given Hub always renders the same identity color on both.
const HUB_GRADIENTS: [string, string][] = [
  ["#6B48A8", "#2B1E4A"], ["#0D7377", "#053B3D"], ["#B38238", "#7A5222"],
  ["#2D6A4F", "#123423"], ["#7a241c", "#3D120E"], ["#4A6FA5", "#1F3554"],
  ["#C97C5D", "#7A4128"],
];

export function hubGradient(id: number): [string, string] {
  return HUB_GRADIENTS[Math.abs(id) % HUB_GRADIENTS.length];
}
