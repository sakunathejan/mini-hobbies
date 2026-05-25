import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { loginAdmin } from "../services/authService.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("mini_hobbies_admin");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (credentials) => {
    const data = await loginAdmin(credentials);
    localStorage.setItem("mini_hobbies_admin_token", data.token);
    localStorage.setItem("mini_hobbies_admin", JSON.stringify(data.user));
    setAdmin(data.user);
    toast.success("Welcome back.");
  };

  const logout = () => {
    localStorage.removeItem("mini_hobbies_admin_token");
    localStorage.removeItem("mini_hobbies_admin");
    setAdmin(null);
    toast.success("Logged out.");
  };

  const refreshAdmin = (userData) => {
    localStorage.setItem("mini_hobbies_admin", JSON.stringify(userData));
    setAdmin(userData);
  };

  const value = useMemo(() => ({ admin, login, logout, refreshAdmin, isAdmin: Boolean(admin) }), [admin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
