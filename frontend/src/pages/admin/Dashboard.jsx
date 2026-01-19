import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderService } from '../../services/orderService';
import Loader from '../../components/common/Loader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await orderService.getOrderStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link to="/admin/products" className="card hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Products</h3>
          <p className="text-gray-600">Manage products</p>
        </Link>

        <Link to="/admin/orders" className="card hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Orders</h3>
          <p className="text-gray-600">Manage orders</p>
        </Link>

        <Link to="/admin/users" className="card hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Users</h3>
          <p className="text-gray-600">Manage users</p>
        </Link>

        <Link to="/admin/categories" className="card hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Categories</h3>
          <p className="text-gray-600">Manage categories</p>
        </Link>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-blue-50">
            <h3 className="text-gray-600 mb-2">Total Orders</h3>
            <p className="text-4xl font-bold text-blue-600">{stats.totalOrders}</p>
          </div>

          <div className="card bg-green-50">
            <h3 className="text-gray-600 mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
          </div>

          <div className="card bg-purple-50">
            <h3 className="text-gray-600 mb-2">Order Status</h3>
            <div className="space-y-2 mt-2">
              {stats.ordersByStatus.map(status => (
                <div key={status._id} className="flex justify-between">
                  <span className="capitalize">{status._id}</span>
                  <span className="font-semibold">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
