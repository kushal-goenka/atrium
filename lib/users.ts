import { cookies } from "next/headers";

export type UserRole = "admin" | "curator" | "installer" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  team?: string;
  lastSeen: string;
  /** Email avatars are gravatar-ish; for the alpha we render colored initials. */
  initials: string;
}

/**
 * Demo directory. Once real SSO lands in v0.2 this is replaced by Prisma `User`
 * lookups. The shape stays identical, so UI code doesn't need to change.
 */
export const MOCK_USERS: User[] = [
  { id: "jordan", email: "jordan@acme.corp", name: "Jordan Rhee", role: "admin", team: "Platform", lastSeen: "2026-04-18T11:10:00Z", initials: "JR" },
  { id: "alice", email: "alice@acme.corp", name: "Alice Chen", role: "curator", team: "DevEx", lastSeen: "2026-04-18T10:58:00Z", initials: "AC" },
  { id: "priya", email: "priya@acme.corp", name: "Priya Patel", role: "installer", team: "Frontend", lastSeen: "2026-04-18T08:00:00Z", initials: "PP" },
  { id: "sam", email: "sam@acme.corp", name: "Sam Rivera", role: "installer", team: "Data", lastSeen: "2026-04-18T06:00:00Z", initials: "SR" },
  { id: "marco", email: "marco@acme.corp", name: "Marco Silva", role: "viewer", team: "Sales Eng", lastSeen: "2026-04-17T22:00:00Z", initials: "MS" },
];

const COOKIE = "atrium-acting-as";

export async function currentUser(): Promise<User> {
  const store = await cookies();
  const actingAs = store.get(COOKIE)?.value;
  const found = actingAs ? MOCK_USERS.find((u) => u.id === actingAs) : null;
  // Default to the first admin for unauthenticated reads — a reasonable
  // dev posture before SSO lands.
  return found ?? MOCK_USERS[0]!;
}

export function findUser(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id || u.email === id);
}

/** Deterministic color from email for avatar tints. */
export function userColor(email: string): string {
  const palette = ["#b8562c", "#2a5d9f", "#14784a", "#a76a0a", "#7a2a9f", "#1f7a78"];
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}

export { COOKIE as ACTING_AS_COOKIE };
