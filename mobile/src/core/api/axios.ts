import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppConstants from '../../shared/constants/app';
import {handleSessionExpired} from '../session/session';
import {refreshAccessToken} from '../session/tokenRefresh';

const api = axios.create({
  baseURL: AppConstants.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Every authenticated API request automatically gets the JWT token.
 */
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

/**
 * Endpoints that legitimately answer 401 for bad credentials. A 401 from these
 * means "wrong password", not an expired session, so it must not log the user
 * out.
 */
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-registration-otp',
  '/auth/resend-otp',
  '/auth/refresh',
  '/admin/login',
];

const isPublicAuthRequest = (url?: string) =>
  !!url && PUBLIC_AUTH_PATHS.some(path => url.includes(path));

/**
 * Common response error handler.
 *
 * A 401 on an authenticated route normally only means the short-lived access
 * token has expired. The request is retried once with a renewed token, so an
 * active session is never interrupted. Only when that renewal fails is the
 * session really over and the user sent back to Login.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      isPublicAuthRequest(original?.url)
    ) {
      return Promise.reject(error);
    }

    // One retry per request, and never retry the renewal call itself.
    if (!original || original._retry) {
      await handleSessionExpired();

      return Promise.reject(error);
    }

    original._retry = true;

    const newToken = await refreshAccessToken();

    if (!newToken) {
      await handleSessionExpired();

      return Promise.reject(error);
    }

    // Replaying the config re-runs the request interceptor, which attaches the
    // newly stored token.
    return api(original);
  },
);

export default api;

export const SERVER_BASE_URL = api.defaults.baseURL?.replace('/api', '') || ''; //  this is a new 
