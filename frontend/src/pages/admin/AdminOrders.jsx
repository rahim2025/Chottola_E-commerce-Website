import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSearch, FaEye, FaFilter } from 'react-icons/fa';
import { orderService } from '../../services/orderService';
import Loader from '../../components/common/Loader';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderView, setOrderView] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ active: 0, completed: 0 });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchCounts();
    fetchStats();
  }, [currentPage, statusFilter, paymentFilter, orderView]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (paymentFilter !== 'all') {
        params.paymentStatus = paymentFilter;
      }

      const response = await orderService.getGroupedOrders(orderView, params);

      if (response.success) {
        setOrders(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        toast.error(response.message || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load orders';
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const [activeResponse, completedResponse] = await Promise.all([
        orderService.getGroupedOrders('active', { page: 1, limit: 1 }),
        orderService.getGroupedOrders('completed', { page: 1, limit: 1 })
      ]);

      setCounts({
        active: activeResponse?.pagination?.total || 0,
        completed: completedResponse?.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching grouped counts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await orderService.getOrderStats();
      if (response.success && response.data.ordersByStatus) {
        const statusData = response.data.ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});

        setStats({
          total: response.data.totalOrders || 0,
          pending: statusData.pending || 0,
          processing: statusData.processing || 0,
          shipped: statusData.shipped || 0,
          delivered: statusData.delivered || 0,
          cancelled: statusData.cancelled || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, {
        orderStatus: newStatus
      });

      if (response.success) {
        toast.success('Order status updated successfully');
        fetchOrders();
        fetchCounts();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handlePaymentStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, {
        paymentStatus: newStatus
      });

      if (response.success) {
        toast.success('Payment status updated successfully');
        fetchOrders();
        fetchCounts();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order?.orderNumber?.toLowerCase().includes(searchLower) ||
      order?.user?.name?.toLowerCase().includes(searchLower) ||
      order?.user?.email?.toLowerCase().includes(searchLower) ||
      order?.shippingAddress?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && orders.length === 0) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
        <p className="text-gray-600 mt-2">View and manage all customer orders</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setOrderView('active');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              orderView === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active Orders ({counts.active})
          </button>
          <button
            onClick={() => {
              setOrderView('completed');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              orderView === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed Orders ({counts.completed})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-4">
          <div className="text-sm text-yellow-700 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
          <div className="text-sm text-blue-700 mb-1">Processing</div>
          <div className="text-2xl font-bold text-blue-900">{stats.processing}</div>
        </div>

        <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-200 p-4">
          <div className="text-sm text-purple-700 mb-1">Shipped</div>
          <div className="text-2xl font-bold text-purple-900">{stats.shipped}</div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
          <div className="text-sm text-green-700 mb-1">Delivered</div>
          <div className="text-2xl font-bold text-green-900">{stats.delivered}</div>
        </div>

        <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4">
          <div className="text-sm text-red-700 mb-1">Cancelled</div>
          <div className="text-2xl font-bold text-red-900">{stats.cancelled}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaSearch className="inline mr-2" />
              Search Orders
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order number, customer name, email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFilter className="inline mr-2" />
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    {orderView === 'completed' ? 'No completed orders found' : 'No active orders found'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderId = order?._id;
                  return (
                    <tr key={orderId || order?.orderNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order?.orderNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order?.user?.name || order?.shippingAddress?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order?.user?.email || order?.shippingAddress?.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order?.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order?.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ৳{order?.totalAmount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order?.paymentMethod || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order?.paymentStatus || 'pending'}
                          onChange={(e) => orderId && handlePaymentStatusUpdate(orderId, e.target.value)}
                          disabled={!orderId}
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${getPaymentStatusColor(order?.paymentStatus)} cursor-pointer disabled:opacity-50`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order?.orderStatus || 'pending'}
                          onChange={(e) => orderId && handleStatusUpdate(orderId, e.target.value)}
                          disabled={!orderId}
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(order?.orderStatus)} cursor-pointer disabled:opacity-50`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {orderId ? (
                          <Link
                            to={`/admin/orders/${orderId}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium inline-flex items-center"
                          >
                            <FaEye className="mr-1" />
                            View Details
                          </Link>
                        ) : (
                          <span className="text-gray-400 inline-flex items-center">
                            <FaEye className="mr-1" />
                            Unavailable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === index + 1
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
