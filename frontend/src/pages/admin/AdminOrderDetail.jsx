import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCreditCard, FaHistory } from 'react-icons/fa';
import { orderService } from '../../services/orderService';
import Loader from '../../components/common/Loader';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrder(id);
      if (response.success) {
        setOrder(response.data);
      } else {
        toast.error('Failed to load order details');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error(error.response?.data?.message || 'Failed to load order details');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change the order status to "${newStatus}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      const response = await orderService.updateOrderStatus(id, {
        orderStatus: newStatus,
        note: statusNote || undefined
      });

      if (response.success) {
        toast.success('Order status updated successfully');
        setStatusNote('');
        fetchOrder();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await orderService.updateOrderStatus(id, {
        paymentStatus: newStatus
      });

      if (response.success) {
        toast.success('Payment status updated successfully');
        fetchOrder();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      shipped: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `৳${amount?.toFixed(2) || '0.00'}`;
  };

  if (loading) {
    return <Loader />;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link to="/admin/orders" className="btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/orders"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusColor(order.orderStatus)}`}>
            {order.orderStatus.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Order Items ({order.items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.sku && (
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                      <span className="text-sm text-gray-600">Price: {formatCurrency(item.price)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax:</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FaHistory className="mr-2" />
                Status History
              </h2>
              <div className="space-y-4">
                {order.statusHistory.slice().reverse().map((history, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(history.status).split(' ')[0]}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold capitalize px-3 py-1 rounded-full text-sm ${getStatusColor(history.status)}`}>
                          {history.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(history.timestamp)}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-sm text-gray-600 mt-2">{history.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h2>
            
            {/* Order Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={order.orderStatus}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Status Note */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Note (Optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note for this status change..."
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={order.paymentStatus}
                onChange={(e) => handlePaymentStatusUpdate(e.target.value)}
                disabled={updating}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FaUser className="mr-2" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">
                  {order.shippingAddress.fullName || order.shippingAddress.name || order.user?.name}
                </p>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {order.shippingAddress.email || order.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <FaPhone className="text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">
                    {order.shippingAddress.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2" />
              Shipping Address
            </h2>
            <div className="text-gray-700">
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}</p>
              <p>{order.shippingAddress.division}</p>
              {order.shippingAddress.postalCode && (
                <p>{order.shippingAddress.postalCode}</p>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FaCreditCard className="mr-2" />
              Payment Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium text-gray-900 capitalize">
                  {order.paymentMethod.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              {order.couponCode && (
                <div>
                  <p className="text-sm text-gray-600">Coupon Code</p>
                  <p className="font-medium text-gray-900">{order.couponCode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Notes</h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
