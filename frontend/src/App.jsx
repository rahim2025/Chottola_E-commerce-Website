import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from './stores/authStore';
import { useCartStore } from './stores/cartStore';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminOrderNotifier from './components/common/AdminOrderNotifier';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AddProduct = lazy(() => import('./pages/admin/AddProduct'));
const EditProduct = lazy(() => import('./pages/admin/EditProduct'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));

function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const setCartAuthenticated = useCartStore((state) => state.setAuthenticated);

  // Initialize stores on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync cart with auth state
  useEffect(() => {
    setCartAuthenticated(isAuthenticated && !isAdmin);
  }, [isAuthenticated, isAdmin, setCartAuthenticated]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        {isAuthenticated && isAdmin && <AdminOrderNotifier />}
        <main className="flex-grow">
          <Suspense fallback={<div className="flex items-center justify-center py-12 text-gray-500">Loading...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={isAdmin ? <Home /> : <Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Private Routes */}
              <Route path="/checkout" element={<PrivateRoute>{isAdmin ? <Home /> : <Checkout />}</PrivateRoute>} />
              <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/products/add" element={<AdminRoute><AddProduct /></AdminRoute>} />
              <Route path="/admin/products/edit/:id" element={<AdminRoute><EditProduct /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><SystemSettings /></AdminRoute>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
