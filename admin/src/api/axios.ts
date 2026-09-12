import axios from "axios";

import { handleSessionExpired } from "./session";
import { refreshAccessToken } from "./tokenRefresh";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://site--fx-wallet--y5mbl8ygpzzy.code.run/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Endpoints that legitimately answer 401 for bad credentials. A 401 from these
 * means "wrong password", not an expired session, so it must not log the admin
 * out.
 */
const PUBLIC_AUTH_PATHS = ["/admin/login", "/auth/login", "/admin/refresh"];

const isPublicAuthRequest = (url?: string) =>
  !!url && PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

/**
 * A 401 on an authenticated route normally only means the short-lived access
 * token has expired. The request is retried once with a renewed token, so the
 * admin is not signed out mid-work. Only when that renewal fails is the session
 * really over and the admin sent back to Login.
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

export default api;