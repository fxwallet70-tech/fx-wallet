import axios from 'axios';

import AppConstants from '../../shared/constants/app';
import {
  getRefreshToken,
  getToken,
  saveRefreshToken,
  saveToken,
} from '../storage/storage';
import {isTokenExpired} from './session';

/**
 * Bare axios client used only for token renewal.
 *
 * It deliberately does not reuse the shared `api` instance: that instance
 * refreshes on a 401, so routing the refresh call through it would recurse.
 */
const refreshClient = axios.create({
  baseURL: AppConstants.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const requestNewTokens = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await refreshClient.post('/auth/refresh', {refreshToken});
    const newToken = response.data?.token;

    if (!newToken) {
      return null;
    }

    await saveToken(newToken);

    // The server rotates the refresh token on every renewal, so the old one is
    // now dead and must be replaced.
    if (response.data?.refreshToken) {
      await saveRefreshToken(response.data.refreshToken);
    }

    return newToken;
  } catch (error: any) {
    console.log('TOKEN REFRESH FAILED:', error?.response?.data || error?.message);

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
 * True when the app has a usable session.
 *
 * An expired access token is not fatal: as long as the refresh token is still
 * alive the session is renewed silently, so a user who comes back later lands
 * in the app instead of on the Login screen.
 */
export const ensureValidSession = async (): Promise<boolean> => {
  const token = await getToken();

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
  try {
    const [token, refreshToken] = await Promise.all([
      getToken(),
      getRefreshToken(),
    ]);

    if (!refreshToken) {
      return;
    }

    await refreshClient.post(
      '/auth/logout',
      {refreshToken},
      token ? {headers: {Authorization: `Bearer ${token}`}} : undefined,
    );
  } catch (error: any) {
    console.log('SESSION REVOKE FAILED:', error?.message);
  }
};
