import { Navigate, Outlet } from "react-router-dom";
import { useUnifiedAuth } from "../context/UnifiedAuthContext.jsx";

export const AdminRoute = () => {
  const { isAdmin } = useUnifiedAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};

export const CustomerRoute = () => {
  const { isCustomer } = useUnifiedAuth();
  return isCustomer ? <Outlet /> : <Navigate to="/login" replace />;
};

export const GuestRoute = () => {
  const { isAuthenticated, role } = useUnifiedAuth();
  if (!isAuthenticated) return <Outlet />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/account" replace />;
};
