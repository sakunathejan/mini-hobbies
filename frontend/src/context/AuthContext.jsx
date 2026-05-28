import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";
import { useUnifiedAuth } from "./UnifiedAuthContext.jsx";

const AuthContext = createContext(null);

const ADMIN_DATA_KEY = "mini_hobbies_admin";

export const AuthProvider = ({ children }) => {
  const unified = useUnifiedAuth();
  const [admin, setAdmin] = useState(() => {
    if (unified?.isAdmin && unified?.user) return unified.user;
    try {
      const stored = localStorage.getItem(ADMIN_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (unified?.isAdmin && unified?.user) {
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(unified.user));
      setAdmin(unified.user);
    }
  }, [unified?.isAdmin, unified?.user]);

  useEffect(() => {
    if (!unified?.isAdmin && !unified?.isAuthenticated) {
      const stored = localStorage.getItem(ADMIN_DATA_KEY);
      if (stored) {
        try { setAdmin(JSON.parse(stored)); } catch {}
      }
    }
  }, [unified?.isAdmin, unified?.isAuthenticated]);

  const refreshAdmin = useCallback((userData) => {
    try {
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(userData));
      setAdmin(userData);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      admin,
      login: unified.loginAsAdmin,
      logout: unified.logout,
      refreshAdmin,
      loading: unified.loading,
      isAdmin: unified.isAdmin,
    }),
    [admin, unified, refreshAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
