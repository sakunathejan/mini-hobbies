import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { unifiedLogin, unifiedLogout } from "../services/unifiedAuthService.js";
import { loginCustomer, logoutCustomer, googleLogin as googleLoginApi } from "../services/customerAuthService.js";
import { loginAdmin, logoutAdmin } from "../services/authService.js";
import api from "../services/api.js";
import customerApi from "../services/customerApi.js";

const UnifiedAuthContext = createContext(null);

const CUSTOMER_KEY = "mini_hobbies_customer_token";
const CUSTOMER_DATA_KEY = "mini_hobbies_customer";
const ADMIN_KEY = "mini_hobbies_admin_token";
const ADMIN_DATA_KEY = "mini_hobbies_admin";
const ROLE_KEY = "mini_hobbies_role";

export const UnifiedAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const role = localStorage.getItem(ROLE_KEY);
      if (role === "admin") {
        const stored = localStorage.getItem(ADMIN_DATA_KEY);
        return stored ? { ...JSON.parse(stored), role: "admin" } : null;
      }
      if (role === "customer") {
        const stored = localStorage.getItem(CUSTOMER_DATA_KEY);
        return stored ? { ...JSON.parse(stored), role: "customer" } : null;
      }
      return null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(CUSTOMER_KEY);
      localStorage.removeItem(CUSTOMER_DATA_KEY);
      localStorage.removeItem(ADMIN_KEY);
      localStorage.removeItem(ADMIN_DATA_KEY);
      localStorage.removeItem(ROLE_KEY);
      setUser(null);
    };
    window.addEventListener("customer:unauthorized", handleUnauthorized);
    window.addEventListener("admin:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("customer:unauthorized", handleUnauthorized);
      window.removeEventListener("admin:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await unifiedLogin(credentials);
      const role = data.role;
      const userData = { ...data.user, role };

      if (role === "admin") {
        localStorage.setItem(ADMIN_KEY, data.token);
        if (data.refreshToken) localStorage.setItem("mini_hobbies_admin_refresh", data.refreshToken);
        localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data.user));
      } else {
        localStorage.setItem(CUSTOMER_KEY, data.token);
        localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data.user));
      }
      localStorage.setItem(ROLE_KEY, role);
      setUser(userData);
      toast.success(role === "admin" ? "Welcome back, admin." : "Welcome back!");
      return { role, user: userData };
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsCustomer = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await loginCustomer(credentials);
      localStorage.setItem(CUSTOMER_KEY, data.token);
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data.customer));
      localStorage.setItem(ROLE_KEY, "customer");
      const userData = { ...data.customer, role: "customer" };
      setUser(userData);
      toast.success("Welcome back!");
      return { role: "customer", user: userData };
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    setLoading(true);
    try {
      const data = await googleLoginApi(credential);
      localStorage.setItem(CUSTOMER_KEY, data.token);
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data.customer));
      localStorage.setItem(ROLE_KEY, "customer");
      setUser({ ...data.customer, role: "customer" });
      toast.success("Welcome back!");
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsAdmin = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await loginAdmin(credentials);
      localStorage.setItem(ADMIN_KEY, data.token);
      if (data.refreshToken) localStorage.setItem("mini_hobbies_admin_refresh", data.refreshToken);
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data.user));
      localStorage.setItem(ROLE_KEY, "admin");
      setUser({ ...data.user, role: "admin" });
      toast.success("Welcome back, admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(CUSTOMER_KEY);
    localStorage.removeItem(CUSTOMER_DATA_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem("mini_hobbies_admin_refresh");
    setUser(null);
    toast.success("Logged out.");
    try {
      await unifiedLogout();
    } catch {}
    try {
      await logoutAdmin();
    } catch {}
    try {
      await logoutCustomer();
    } catch {}
  }, []);

  const refreshUser = useCallback((userData) => {
    try {
      const role = userData.role || localStorage.getItem(ROLE_KEY);
      const data = { ...userData, role };
      if (role === "admin") {
        localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(userData));
      } else if (role === "customer") {
        localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(userData));
      }
      localStorage.setItem(ROLE_KEY, role);
      setUser(data);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      login,
      loginAsCustomer,
      loginWithGoogle,
      loginAsAdmin,
      logout,
      refreshUser,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isCustomer: user?.role === "customer",
    }),
    [user, login, loginAsCustomer, loginWithGoogle, loginAsAdmin, logout, refreshUser, loading]
  );

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = () => {
  const ctx = useContext(UnifiedAuthContext);
  if (!ctx) throw new Error("useUnifiedAuth must be used within UnifiedAuthProvider");
  return ctx;
};
