import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../api/axios";

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
  login: (token: string, user: User) => void;
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
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("userData");

    if (!DEMO_MODE && storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
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

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("userData", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
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