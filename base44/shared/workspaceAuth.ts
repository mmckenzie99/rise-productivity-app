// Shared workspace-credential helpers used by the workspaceAuth and data
// backend functions. Passwords are hashed with SHA-256 + a per-workspace salt
// via Web Crypto (SubtleCrypto). The data functions authenticate each call by
// re-validating the workspace password against the stored hash.

export function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomId(): string {
  return crypto.randomUUID();
}

export function randomSalt(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

// Validate workspace credentials. Returns the workspace doc if the id exists
// and the password matches, otherwise null. `base44` is a service-role-capable
// client created via createClientFromRequest in the calling function.
export async function validateWorkspace(
  base44: any,
  workspaceId: string,
  password: string
): Promise<any | null> {
  if (!workspaceId || !password) return null;
  const list = await base44.asServiceRole.entities.Workspace.filter({ workspace_id: workspaceId });
  const ws = list && list[0];
  if (!ws) return null;
  const hash = await hashPassword(password, ws.salt);
  return hash === ws.password_hash ? ws : null;
}