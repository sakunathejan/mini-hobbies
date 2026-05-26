import { createContext, useContext, useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { loginAdmin, logoutAdmin } from "../services/authService.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem("mini_hobbies_admin");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await loginAdmin(credentials);
      localStorage.setItem("mini_hobbies_admin_token", data.token);
      localStorage.setItem("mini_hobbies_admin", JSON.stringify(data.user));
      setAdmin(data.user);
      toast.success("Welcome back.");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch {}
    localStorage.removeItem("mini_hobbies_admin_token");
    localStorage.removeItem("mini_hobbies_admin");
    setAdmin(null);
    toast.success("Logged out.");
  }, []);

  const refreshAdmin = useCallback((userData) => {
    try {
      localStorage.setItem("mini_hobbies_admin", JSON.stringify(userData));
      setAdmin(userData);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ admin, login, logout, refreshAdmin, loading, isAdmin: Boolean(admin) }),
    [admin, login, logout, refreshAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
