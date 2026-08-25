// Device-tied workspace session for the no-account access model. The workspace
// id + shared password live in localStorage; every data call re-validates the
// password server-side, so this is a convenience credential, not a secret.
const KEY = 'b44:workspace';

export function getSession() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}