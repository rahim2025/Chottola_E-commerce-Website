import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderService } from '../services/orderService';
import api from '../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [ratingSubmitting, setRatingSubmitting] = useState({});

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await orderService.getOrder(id);
      if (response.success) {
        setOrder(response.data);
      } else {
        setError('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      if (error.response?.status === 404) {
        setError('Order not found');
      } else if (error.response?.status === 403) {
        setError('You are not authorized to view this order');
      } else {
        setError('Failed to load order details');
      }
      toast.error(error.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: '📋' },
      { key: 'processing', label: 'Processing', icon: '⚙️' },
      { key: 'shipped', label: 'Shipped', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '📦' }
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
      let status = 'upcoming';
      if (index <= currentIndex) {
        status = 'completed';
      } else if (currentStatus === 'cancelled') {
        status = 'cancelled';
      }

      return { ...step, status };
    });
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

  const isOrderRateable = order?.orderStatus === 'delivered' && order?.paymentStatus === 'paid';

  const getItemCurrentRating = (item) => {
    return item?.product?.ratings?.average > 0
      ? Number(item.product.ratings.average).toFixed(1)
      : null;
  };

  const submitItemRating = async (productId, fallbackName = 'product') => {
    const value = Number(ratingDrafts[productId] || 0);
    if (!value || value < 1 || value > 5) {
      toast.error('Please choose a rating between 1 and 5');
      return;
    }

    try {
      setRatingSubmitting((prev) => ({ ...prev, [productId]: true }));
      await api.post(`/reviews/${productId}`, { rating: value });
      toast.success(`Rating submitted for ${fallbackName}`);
      await fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingSubmitting((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Order Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The order you're looking for could not be found or you don't have permission to view it.
            </p>
            <div className="space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                Go Back
              </button>
              <Link to="/orders" className="btn-primary">
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link to="/orders" className="hover:text-primary-600">My Orders</Link>
                <span>/</span>
                <span className="text-gray-900">Order Details</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full border font-medium ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus === 'pending' && '⏳'}
                {order.orderStatus === 'processing' && '⚙️'}
                {order.orderStatus === 'shipped' && '🚚'}
                {order.orderStatus === 'delivered' && '✅'}
                {order.orderStatus === 'cancelled' && '❌'}
                <span className="ml-2 capitalize">{order.orderStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        {order.orderStatus !== 'cancelled' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
            <div className="relative">
              <div className="flex justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                      step.status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : step.status === 'cancelled'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-gray-200 border-gray-300 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? '✓' : step.icon}
                    </div>
                    <p className={`mt-2 text-sm font-medium text-center ${
                      step.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </p>
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute top-6 w-full h-0.5 -z-10 ${
                        statusSteps[index + 1].status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`} style={{ left: `${(100 / statusSteps.length) * (index + 0.5)}%`, width: `${100 / statusSteps.length}%` }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Order Items ({order.items?.length || 0})
              </h2>
              <div className="space-y-6">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 pb-6 border-b border-gray-200 last:border-b-0">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.sku && (
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                        <span className="text-sm text-gray-600">Price: {formatCurrency(item.price)}</span>
                      </div>

                      {isOrderRateable && item.product?._id && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const selected = Number(ratingDrafts[item.product._id] || 0);
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setRatingDrafts((prev) => ({
                                      ...prev,
                                      [item.product._id]: star
                                    }))
                                  }
                                  className="p-0.5"
                                  aria-label={`Rate ${star}`}
                                >
                                  <svg
                                    className={`w-4 h-4 ${star <= selected ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => submitItemRating(item.product._id, item.name)}
                            disabled={ratingSubmitting[item.product._id]}
                            className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {ratingSubmitting[item.product._id] ? 'Saving...' : 'Submit Rating'}
                          </button>

                          {getItemCurrentRating(item) && (
                            <span className="text-xs text-gray-500">
                              Current: {getItemCurrentRating(item)} ★
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatCurrency(item.originalPrice * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Payment & Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(order.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">
                    {order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Free'}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.couponCode && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Coupon:</span>
                    <span className="font-mono">{order.couponCode}</span>
                  </div>
                )}
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-primary-600">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'pending' ? 'Pending' : 'Failed'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                  <span className="text-sm text-gray-900 capitalize">
                    {order.paymentMethod?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-sm space-y-2">
                <p className="font-semibold text-gray-900">{order.shippingAddress?.name}</p>
                <p className="text-gray-600">{order.shippingAddress?.phone}</p>
                <div className="text-gray-600">
                  <p>{order.shippingAddress?.street}</p>
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
              <div className="space-y-3">
                <button className="w-full btn-secondary text-left">
                  📞 Contact Support
                </button>
                {order.orderStatus === 'delivered' && (
                  <button className="w-full btn-secondary text-left">
                    ⭐ Rate Ordered Items
                  </button>
                )}
                {(order.orderStatus === 'pending' || order.orderStatus === 'processing') && (
                  <button className="w-full btn-secondary text-left text-red-600">
                    ❌ Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
