import axios from "axios";

import { handleSessionExpired } from "./session";
import { refreshAccessToken } from "./tokenRefresh";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Endpoints that legitimately answer 401 for bad credentials. A 401 from these
 * means "wrong password", not an expired session, so it must not log the user
 * out.
 */
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-registration-otp",
  "/auth/refresh",
];

const isPublicAuthRequest = (url?: string) =>
  !!url && PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

/**
 * A 401 on an authenticated route normally only means the short-lived access
 * token has expired. The request is retried once with a renewed token, so an
 * active session is never interrupted. Only when that renewal fails is the
 * session really over and the user sent back to the login page.
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
      handleSessionExpired();

      return Promise.reject(error);
    }

    original._retry = true;

    const newToken = await refreshAccessToken();

    if (!newToken) {
      handleSessionExpired();

      return Promise.reject(error);
    }

    // Replaying the config re-runs the request interceptor, which attaches the
    // newly stored token.
    return api(original);
  }
);

export const SERVER_BASE_URL = api.defaults.baseURL?.replace('/api', '') || '';

export default api;