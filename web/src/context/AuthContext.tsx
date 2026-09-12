import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../api/axios";
import { SESSION_EXPIRED_EVENT, clearSession } from "../api/session";
import { ensureValidSession, revokeSession } from "../api/tokenRefresh";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const DEMO_USER = {
  id: "demo-user-123",
  fullName: "Demo User",
  email: "demo@fxwallet.com",
  mobile: "9876543210",
  walletBalance: 25000,
  isActive: true,
};

interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  walletBalance: number;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_MODE ? DEMO_USER : null);
  const [token, setToken] = useState<string | null>(DEMO_MODE ? "demo-token" : null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);

      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      // An expired access token is renewed here when the refresh token is still
      // alive, so a returning user is not pushed back to the login page.
      const usable = await ensureValidSession();

      if (cancelled) {
        return;
      }

      const storedUser = localStorage.getItem("userData");

      if (!usable || !storedUser) {
        // Stale or half-written session: drop it, don't let it grant access.
        clearSession();

        return;
      }

      try {
        setUser(JSON.parse(storedUser));
        setToken(localStorage.getItem("authToken"));
      } catch {
        clearSession();
      }
    };

    restoreSession().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 from any API call means the session is gone: drop the in-memory user
  // so ProtectedRoute sends the browser back to the login page.
  useEffect(() => {
    const onSessionExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, []);

  const refreshUser = async () => {
    if (DEMO_MODE || !token) return;
    try {
      const res = await api.get("/auth/me");
      if (res.data.success && res.data.user) {
        const userData = res.data.user;
        setUser(userData);
        localStorage.setItem("userData", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
      logout();
    }
  };

  const login = (newToken: string, userData: User, refreshToken?: string) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("userData", JSON.stringify(userData));

    // Stored so the session can be renewed once the access token expires.
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
  };

  const logout = () => {
    // Best effort: revoke the refresh token server-side first, before the local
    // copy is dropped.
    void revokeSession();

    setToken(null);
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}