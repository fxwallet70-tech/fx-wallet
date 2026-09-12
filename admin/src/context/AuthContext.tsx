import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  REFRESH_KEY,
  SESSION_EXPIRED_EVENT,
  SESSION_KEY,
  clearSession,
} from "../api/session";
import { ensureValidSession, revokeSession } from "../api/tokenRefresh";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, email: string, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  function login(token: string, email: string, refreshToken?: string) {
    localStorage.setItem(SESSION_KEY, token);

    // Stored so the session can be renewed once the access token expires.
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }

    setUser({ email });
  }

  function logout() {
    // Best effort: revoke the refresh token server-side first, before the local
    // copy is dropped.
    void revokeSession();

    clearSession();
    setUser(null);
  }

  // An expired access token is renewed on load when the refresh token is still
  // alive, so an admin who left the panel open is not logged out.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const usable = await ensureValidSession();

      if (cancelled || usable) {
        return;
      }

      // Nothing could be renewed: the session is really over.
      clearSession();
      navigate("/", { replace: true });
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // A 401 from any API call means the session is gone: log out and go to login.
  useEffect(() => {
    const onSessionExpired = () => {
      setUser(null);
      navigate("/", { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
