import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';

const Dashboard = () => {
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await orderService.getOrderStats();
        if (response.success && Array.isArray(response.data?.ordersByStatus)) {
          const pending = response.data.ordersByStatus.find((item) => item._id === 'pending')?.count || 0;
          setPendingOrders(pending);
        }
      } catch (error) {
        console.error('Failed to fetch pending orders count:', error);
      }
    };

    fetchPendingOrders();
    const intervalId = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link to="/admin/settings" className="btn-primary">
          System Settings
        </Link>
      </div>

      {pendingOrders > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-yellow-900 font-semibold">
            🔔 Pending Order Alert: {pendingOrders} order{pendingOrders > 1 ? 's' : ''} waiting for action.
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link to="/admin/products" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Products</h3>
              <p className="text-gray-600">Manage products</p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </Link>

        <Link to="/admin/orders" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Orders</h3>
              <p className="text-gray-600">
                Manage orders{pendingOrders > 0 ? ` (${pendingOrders} pending)` : ''}
              </p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </Link>

        <Link to="/admin/users" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Users</h3>
              <p className="text-gray-600">Manage users</p>
            </div>
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </Link>

        <Link to="/admin/categories" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Categories</h3>
              <p className="text-gray-600">Manage categories</p>
            </div>
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
