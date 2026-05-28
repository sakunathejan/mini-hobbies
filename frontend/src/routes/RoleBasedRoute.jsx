import { Navigate, Outlet } from "react-router-dom";
import { useUnifiedAuth } from "../context/UnifiedAuthContext.jsx";

export const AdminRoute = () => {
  const { isAdmin } = useUnifiedAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};

export const CustomerRoute = () => {
  const { isCustomer } = useUnifiedAuth();
  if (!isCustomer) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const GuestRoute = () => {
  const { isAuthenticated, role } = useUnifiedAuth();
  if (!isAuthenticated) return <Outlet />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/account" replace />;
};
