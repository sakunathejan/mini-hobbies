import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";
import { useUnifiedAuth } from "./UnifiedAuthContext.jsx";

const CustomerAuthContext = createContext(null);

const CUSTOMER_DATA_KEY = "mini_hobbies_customer";

export const CustomerAuthProvider = ({ children }) => {
  const unified = useUnifiedAuth();
  const [customer, setCustomer] = useState(() => {
    if (unified?.isCustomer && unified?.user) return unified.user;
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
    const handleUnauthorized = () => {
      localStorage.removeItem(CUSTOMER_DATA_KEY);
      setCustomer(null);
    };
    window.addEventListener("customer:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("customer:unauthorized", handleUnauthorized);
  }, []);

  const refreshCustomer = useCallback(async () => {
    const token = localStorage.getItem("mini_hobbies_customer_token");
    if (!token) return;
    try {
      const { getCustomerProfile } = await import("../services/customerAuthService.js");
      const data = await getCustomerProfile();
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data));
      setCustomer(data);
    } catch {
      localStorage.removeItem("mini_hobbies_customer_token");
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
      login: unified.loginAsCustomer,
      logout: unified.logout,
      refreshCustomer,
      setCustomerData,
      loading: unified.loading,
      isAuthenticated: unified.isCustomer,
    }),
    [customer, unified, refreshCustomer, setCustomerData]
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
