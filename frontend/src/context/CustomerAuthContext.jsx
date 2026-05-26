import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { loginCustomer, logoutCustomer, getCustomerProfile } from "../services/customerAuthService.js";
import { useUnifiedAuth } from "./UnifiedAuthContext.jsx";

const CustomerAuthContext = createContext(null);

const CUSTOMER_KEY = "mini_hobbies_customer_token";
const CUSTOMER_DATA_KEY = "mini_hobbies_customer";

export const CustomerAuthProvider = ({ children }) => {
  const unified = useUnifiedAuth();
  const [customer, setCustomer] = useState(() => {
    if (unified?.isCustomer && unified?.user) {
      return unified.user;
    }
    try {
      const stored = localStorage.getItem(CUSTOMER_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (unified?.isCustomer && unified?.user) {
      const userData = unified.user;
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(userData));
      setCustomer(userData);
    }
  }, [unified?.isCustomer, unified?.user]);

  useEffect(() => {
    if (!unified?.isAuthenticated) {
      const stored = localStorage.getItem(CUSTOMER_DATA_KEY);
      if (stored) {
        try { setCustomer(JSON.parse(stored)); } catch {}
      } else {
        setCustomer(null);
      }
    }
  }, [unified?.isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(CUSTOMER_KEY);
      localStorage.removeItem(CUSTOMER_DATA_KEY);
      setCustomer(null);
    };
    window.addEventListener("customer:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("customer:unauthorized", handleUnauthorized);
  }, []);

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await loginCustomer(credentials);
      localStorage.setItem(CUSTOMER_KEY, data.token);
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data.customer));
      setCustomer(data.customer);
      toast.success("Welcome back!");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await unified.logout();
    } catch {
      try { await logoutCustomer(); } catch {}
    }
    localStorage.removeItem(CUSTOMER_KEY);
    localStorage.removeItem(CUSTOMER_DATA_KEY);
    setCustomer(null);
    toast.success("Logged out.");
  }, [unified]);

  const refreshCustomer = useCallback(async () => {
    const token = localStorage.getItem(CUSTOMER_KEY);
    if (!token) return;
    try {
      const data = await getCustomerProfile();
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data));
      setCustomer(data);
    } catch {
      localStorage.removeItem(CUSTOMER_KEY);
      localStorage.removeItem(CUSTOMER_DATA_KEY);
      setCustomer(null);
    }
  }, []);

  const setCustomerData = useCallback((data) => {
    localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data));
    setCustomer(data);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      login,
      logout,
      refreshCustomer,
      setCustomerData,
      loading,
      isAuthenticated: Boolean(customer),
    }),
    [customer, login, logout, refreshCustomer, setCustomerData, loading]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
};
