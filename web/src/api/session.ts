/**
 * Session helpers shared by the API layer and AuthContext.
 *
 * Deliberately free of React so the axios interceptor can use it directly.
 */

export const SESSION_KEYS = ["authToken", "refreshToken", "userData"];

/** Fired after a 401 so AuthContext can drop the in-memory user. */
export const SESSION_EXPIRED_EVENT = "session-expired";

const SESSION_EXPIRED_FLAG = "sessionExpired";

/** Removes every stored credential. */
export const clearSession = () => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

/**
 * Reads the `exp` claim of a JWT. Returns true when the token is missing or
 * already expired. When the token cannot be decoded we assume it is usable, so
 * an unexpected format never logs a valid user out.
 */
export const isTokenExpired = (token?: string | null): boolean => {
  if (!token) {
    return true;
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return false;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));

    if (typeof decoded?.exp !== "number") {
      return false;
    }

    return Date.now() >= decoded.exp * 1000;
  } catch {
    return false;
  }
};

/** Flags that the user was logged out by an expired session, not by choice. */
export const markSessionExpired = () => {
  try {
    sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");
  } catch {
    // sessionStorage can be unavailable; the redirect still works.
  }
};

/** Reads and clears the flag set by markSessionExpired. */
export const consumeSessionExpired = (): boolean => {
  try {
    const flagged = sessionStorage.getItem(SESSION_EXPIRED_FLAG) === "1";

    if (flagged) {
      sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
    }

    return flagged;
  } catch {
    return false;
  }
};

/**
 * Concurrent requests can all fail with 401 at once; this window makes sure the
 * user is only logged out once.
 */
const REDIRECT_DEBOUNCE_MS = 3000;
let lastHandledAt = 0;

/**
 * Called when the API rejects a request because the JWT is missing, expired or
 * invalid: clears the stored session and tells AuthContext to log out, which
 * sends the user back to the login page instead of leaving them on a broken
 * screen.
 */
export const handleSessionExpired = () => {
  const now = Date.now();

  if (now - lastHandledAt < REDIRECT_DEBOUNCE_MS) {
    return;
  }

  lastHandledAt = now;

  clearSession();
  markSessionExpired();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};
