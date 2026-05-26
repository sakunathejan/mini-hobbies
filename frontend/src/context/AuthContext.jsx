import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { loginAdmin, logoutAdmin } from "../services/authService.js";
import { useUnifiedAuth } from "./UnifiedAuthContext.jsx";

const AuthContext = createContext(null);

const ADMIN_DATA_KEY = "mini_hobbies_admin";
const ADMIN_TOKEN_KEY = "mini_hobbies_admin_token";

export const AuthProvider = ({ children }) => {
  const unified = useUnifiedAuth();
  const [admin, setAdmin] = useState(() => {
    if (unified?.isAdmin && unified?.user) {
      return unified.user;
    }
    try {
      const stored = localStorage.getItem(ADMIN_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (unified?.isAdmin && unified?.user) {
      const userData = unified.user;
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(userData));
      setAdmin(userData);
    }
  }, [unified?.isAdmin, unified?.user]);

  useEffect(() => {
    if (!unified?.isAdmin && !unified?.isAuthenticated) {
      const stored = localStorage.getItem(ADMIN_DATA_KEY);
      if (stored) {
        try {
          setAdmin(JSON.parse(stored));
        } catch {}
      }
    }
  }, [unified?.isAdmin, unified?.isAuthenticated]);

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await loginAdmin(credentials);
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data.user));
      setAdmin(data.user);
      toast.success("Welcome back.");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await unified.logout();
    } catch {
      try { await logoutAdmin(); } catch {}
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    setAdmin(null);
    toast.success("Logged out.");
  }, [unified]);

  const refreshAdmin = useCallback((userData) => {
    try {
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(userData));
      setAdmin(userData);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ admin, login, logout, refreshAdmin, loading, isAdmin: Boolean(admin) }),
    [admin, login, logout, refreshAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
