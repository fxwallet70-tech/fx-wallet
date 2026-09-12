import axios from "axios";

import { isTokenExpired } from "./session";

/**
 * Bare axios client used only for token renewal.
 *
 * It deliberately does not reuse the shared `api` instance: that instance
 * refreshes on a 401, so routing the refresh call through it would recurse.
 */
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

export const AUTH_TOKEN_KEY = "authToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

const requestNewTokens = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await refreshClient.post("/auth/refresh", { refreshToken });

    if (!data?.token) {
      return null;
    }

    localStorage.setItem(AUTH_TOKEN_KEY, data.token);

    // The server rotates the refresh token on every renewal, so the old one is
    // now dead and must be replaced.
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    return data.token as string;
  } catch (error) {
    console.error("Token refresh failed:", error);

    return null;
  }
};

/**
 * Several requests can all hit an expired access token at the same time. They
 * share one in-flight renewal, so the refresh token is rotated exactly once.
 */
let inFlightRefresh: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for a fresh access token.
 *
 * @returns the new access token, or null when the session can no longer be
 * renewed and the user has to log in again.
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  if (!inFlightRefresh) {
    inFlightRefresh = requestNewTokens().finally(() => {
      inFlightRefresh = null;
    });
  }

  return inFlightRefresh;
};

/**
 * True when there is a usable session.
 *
 * An expired access token is not fatal: as long as the refresh token is still
 * alive the session is renewed silently, so a returning user lands in the app
 * instead of on the login page.
 */
export const ensureValidSession = async (): Promise<boolean> => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token && !isTokenExpired(token)) {
    return true;
  }

  return !!(await refreshAccessToken());
};

/**
 * Revokes the refresh token on the server so a copied one cannot be replayed
 * after logout. Best effort - the caller clears the local session regardless.
 */
export const revokeSession = async (): Promise<void> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    return;
  }

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    await refreshClient.post(
      "/auth/logout",
      { refreshToken },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  } catch (error) {
    console.error("Session revoke failed:", error);
  }
};
