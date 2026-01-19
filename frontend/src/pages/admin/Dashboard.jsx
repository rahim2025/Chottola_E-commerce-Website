import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [orderResponse, usersResponse] = await Promise.all([
        orderService.getOrderStats(),
        isSuperAdmin ? userService.getAllUsers() : Promise.resolve(null)
      ]);
      
      setStats(orderResponse.data);
      
      if (usersResponse) {
        const users = usersResponse.data.data;
        const usersByRole = users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        
        setUserStats({
          total: users.length,
          byRole: usersByRole,
          active: users.filter(u => u.accountStatus === 'active').length,
          suspended: users.filter(u => u.accountStatus === 'suspended').length
        });
      }
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
        </h1>
        {isSuperAdmin && (
          <Link to="/admin/settings" className="btn-primary">
            System Settings
          </Link>
        )}
      </div>

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
              <p className="text-gray-600">Manage orders</p>
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

      {/* Super Admin User Statistics */}
      {isSuperAdmin && userStats && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6\">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100\">
              <h3 className="text-gray-600 mb-2\">Total Users</h3>
              <p className="text-4xl font-bold text-blue-600\">{userStats.total}</p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100\">
              <h3 className="text-gray-600 mb-2\">Active Users</h3>
              <p className="text-4xl font-bold text-green-600\">{userStats.active}</p>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100\">
              <h3 className="text-gray-600 mb-2\">Admins</h3>
              <p className="text-4xl font-bold text-purple-600\">
                {(userStats.byRole.admin || 0) + (userStats.byRole['super-admin'] || 0)}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100\">
              <h3 className="text-gray-600 mb-2\">Suspended</h3>
              <p className="text-4xl font-bold text-red-600\">{userStats.suspended}</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4\">
            <div className="card\">
              <h4 className="text-sm text-gray-600 mb-2\">Customers</h4>
              <p className="text-2xl font-semibold\">{userStats.byRole.customer || 0}</p>
            </div>
            <div className="card\">
              <h4 className="text-sm text-gray-600 mb-2\">Moderators</h4>
              <p className="text-2xl font-semibold\">{userStats.byRole.moderator || 0}</p>
            </div>
            <div className="card\">
              <h4 className="text-sm text-gray-600 mb-2\">Admins</h4>
              <p className="text-2xl font-semibold\">{userStats.byRole.admin || 0}</p>
            </div>
            <div className="card\">
              <h4 className="text-sm text-gray-600 mb-2\">Super Admins</h4>
              <p className="text-2xl font-semibold\">{userStats.byRole['super-admin'] || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Statistics */}
      {stats && (
        <>
          <h2 className="text-2xl font-semibold mb-4\">Order Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8\">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100\">
              <h3 className="text-gray-600 mb-2\">Total Orders</h3>
              <p className="text-4xl font-bold text-blue-600\">{stats.totalOrders}</p>
              <p className="text-sm text-gray-600 mt-2\">All time</p>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100\">
              <h3 className="text-gray-600 mb-2\">Total Revenue</h3>
              <p className="text-4xl font-bold text-green-600\">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-2\">Lifetime earnings</p>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100\">
              <h3 className="text-gray-600 mb-2\">Average Order</h3>
              <p className="text-4xl font-bold text-purple-600\">
                ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-gray-600 mt-2\">Per order</p>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="card\">
            <h3 className="text-xl font-semibold mb-4\">Orders by Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4\">
              {stats.ordersByStatus.map(status => (
                <div key={status._id} className="p-4 bg-gray-50 rounded-lg\">
                  <div className="flex justify-between items-center\">
                    <span className="capitalize font-medium\">{status._id}</span>
                    <span className="text-2xl font-bold text-blue-600\">{status.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
