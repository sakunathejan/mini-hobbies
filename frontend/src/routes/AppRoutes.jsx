import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout.jsx";
import StoreLayout from "../layouts/StoreLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

const HomePage = lazy(() => import("../pages/HomePage.jsx"));
const ProductListPage = lazy(() => import("../pages/ProductListPage.jsx"));
const ProductDetailsPage = lazy(() => import("../pages/ProductDetailsPage.jsx"));
const CartPage = lazy(() => import("../pages/CartPage.jsx"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage.jsx"));
const WishlistPage = lazy(() => import("../pages/WishlistPage.jsx"));
const LoginPage = lazy(() => import("../pages/admin/LoginPage.jsx"));
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
    </Route>
    <Route path="admin/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
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
        <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
