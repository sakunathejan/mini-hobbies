import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout.jsx";
import StoreLayout from "../layouts/StoreLayout.jsx";
import { AdminRoute, CustomerRoute } from "./RoleBasedRoute.jsx";

const HomePage = lazy(() => import("../pages/HomePage.jsx"));
const ProductListPage = lazy(() => import("../pages/ProductListPage.jsx"));
const ProductDetailsPage = lazy(() => import("../pages/ProductDetailsPage.jsx"));
const CartPage = lazy(() => import("../pages/CartPage.jsx"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage.jsx"));
const WishlistPage = lazy(() => import("../pages/WishlistPage.jsx"));
const AdminLoginPage = lazy(() => import("../pages/admin/LoginPage.jsx"));
const DashboardPage = lazy(() => import("../pages/admin/DashboardPage.jsx"));
const AdminProductsPage = lazy(() => import("../pages/admin/AdminProductsPage.jsx"));
const ProductFormPage = lazy(() => import("../pages/admin/ProductFormPage.jsx"));
const AdminCategoriesPage = lazy(() => import("../pages/admin/AdminCategoriesPage.jsx"));
const AdminOrdersPage = lazy(() => import("../pages/admin/AdminOrdersPage.jsx"));
const OrderTrackPage = lazy(() => import("../pages/OrderTrackPage.jsx"));
const OrderSuccessPage = lazy(() => import("../pages/OrderSuccessPage.jsx"));
const AdminPaymentVerificationPage = lazy(() => import("../pages/admin/AdminPaymentVerificationPage.jsx"));
const AdminCouponsPage = lazy(() => import("../pages/admin/AdminCouponsPage.jsx"));
const AdminDeliveryZonesPage = lazy(() => import("../pages/admin/AdminDeliveryZonesPage.jsx"));
const AdminBankDetailsPage = lazy(() => import("../pages/admin/AdminBankDetailsPage.jsx"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage.jsx"));
const AdminAnnouncementsPage = lazy(() => import("../pages/admin/AdminAnnouncementsPage.jsx"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage.jsx"));
const AdminUserDetailPage = lazy(() => import("../pages/admin/AdminUserDetailPage.jsx"));
// Unified account pages
const LoginPage = lazy(() => import("../pages/account/LoginPage.jsx"));
const ForgotPasswordPage = lazy(() => import("../pages/account/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("../pages/account/ResetPasswordPage.jsx"));
// Customer pages
const CustomerRegisterPage = lazy(() => import("../pages/customer/RegisterPage.jsx"));
const CustomerVerifyEmailPage = lazy(() => import("../pages/customer/VerifyEmailPage.jsx"));
const CustomerDashboardPage = lazy(() => import("../pages/customer/DashboardPage.jsx"));
// Moderation pages
const SuspendedPage = lazy(() => import("../moderation-system/pages/SuspendedPage.jsx"));
const AppealPage = lazy(() => import("../moderation-system/pages/AppealPage.jsx"));
const AdminModerationPage = lazy(() => import("../moderation-system/pages/AdminModerationPage.jsx"));
const ModerationHistoryPage = lazy(() => import("../moderation-system/pages/ModerationHistoryPage.jsx"));

const AppRoutes = () => (
  <Routes>
    <Route element={<StoreLayout />}>
      <Route index element={<HomePage />} />
      <Route path="products" element={<ProductListPage />} />
      <Route path="products/:slug" element={<ProductDetailsPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="track-order" element={<OrderTrackPage />} />
      <Route path="order-success" element={<OrderSuccessPage />} />
      <Route path="wishlist" element={<WishlistPage />} />
      {/* Unified auth */}
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<CustomerRegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="verify-email" element={<CustomerVerifyEmailPage />} />
      {/* Customer account (protected) */}
      <Route element={<CustomerRoute />}>
        <Route path="account" element={<CustomerDashboardPage />} />
        <Route path="account/suspended" element={<SuspendedPage />} />
        <Route path="account/appeal" element={<AppealPage />} />
        <Route path="account/moderation" element={<ModerationHistoryPage />} />
      </Route>
    </Route>
    <Route path="admin/login" element={<AdminLoginPage />} />
    <Route element={<AdminRoute />}>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="payments" element={<AdminPaymentVerificationPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="delivery-zones" element={<AdminDeliveryZonesPage />} />
        <Route path="bank-details" element={<AdminBankDetailsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="moderation" element={<AdminModerationPage />} />
        </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
