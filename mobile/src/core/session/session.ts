import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';

import {resetToLogin} from '../navigation/navigationRef';

/** Keys written on login and removed on logout / session expiry. */
export const SESSION_KEYS = ['authToken', 'refreshToken', 'userData'];

/** Removes every stored credential. */
export const clearSession = async () => {
  await AsyncStorage.removeMany(SESSION_KEYS);
};

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Minimal base64 decoder. JWT payloads here are plain ASCII, so this avoids
 * depending on `atob`, which is not available on every engine.
 */
/* eslint-disable no-bitwise */
const decodeBase64 = (input: string): string => {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');

  let output = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const value = BASE64_CHARS.indexOf(clean[i]);

    if (value === -1) {
      continue;
    }

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};
/* eslint-enable no-bitwise */

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
    const payload = token.split('.')[1];

    if (!payload) {
      return false;
    }

    const decoded = JSON.parse(decodeBase64(payload));

    if (typeof decoded?.exp !== 'number') {
      return false;
    }

    return Date.now() >= decoded.exp * 1000;
  } catch {
    return false;
  }
};

/**
 * Concurrent requests can all fail with 401 at once; this window makes sure the
 * user is only logged out and told about it once.
 */
const REDIRECT_DEBOUNCE_MS = 3000;
let lastRedirectAt = 0;

/**
 * Called when the API rejects a request because the JWT is missing, expired or
 * invalid: clears the stored session and returns the user to Login instead of
 * leaving them stranded on an error screen.
 */
export const handleSessionExpired = async () => {
  const now = Date.now();

  if (now - lastRedirectAt < REDIRECT_DEBOUNCE_MS) {
    return;
  }

  lastRedirectAt = now;

  await clearSession();

  if (resetToLogin()) {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please log in again.',
    );
  }
};
