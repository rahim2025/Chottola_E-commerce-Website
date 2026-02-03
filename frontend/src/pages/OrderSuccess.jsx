import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaCheckCircle, FaBox, FaTruck, FaFileInvoice } from 'react-icons/fa';
import confetti from 'canvas-confetti';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    // If no order details, redirect to orders page
    if (!orderDetails) {
      navigate('/orders');
      return;
    }

    // Celebrate with confetti!
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }));
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }));
    }, 250);

    return () => clearInterval(interval);
  }, [orderDetails, navigate]);

  if (!orderDetails) {
    return null;
  }

  const formatCurrency = (amount) => {
    return `৳${amount?.toFixed(2) || '0.00'}`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full mb-6 animate-bounce">
            <FaCheckCircle className="text-white text-6xl" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Order Placed Successfully! 🎉
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Thank you for your purchase!
          </p>
          
          <p className="text-lg text-gray-500">
            Your order <span className="font-semibold text-indigo-600">#{orderDetails.orderNumber}</span> has been confirmed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Order #{orderDetails.orderNumber}</h2>
                <p className="text-indigo-100">Placed on {formatDate(orderDetails.createdAt)}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(orderDetails.totalAmount)}</div>
                <div className="text-indigo-100 text-sm">Total Amount</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Order Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaBox className="mr-2 text-indigo-600" />
                Items Ordered ({orderDetails.items?.length || 0})
              </h3>
              
              <div className="space-y-4">
                {orderDetails.items?.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FaBox />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                
                {orderDetails.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(orderDetails.tax)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">
                    {orderDetails.shippingCost > 0 ? formatCurrency(orderDetails.shippingCost) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </span>
                </div>
                
                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(orderDetails.discount)}</span>
                  </div>
                )}
                
                <div className="pt-3 mt-3 border-t border-gray-300 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-indigo-600">{formatCurrency(orderDetails.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaTruck className="mr-2 text-indigo-600" />
                Shipping Address
              </h3>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">{orderDetails.shippingAddress?.fullName}</p>
                <p className="text-gray-600">{orderDetails.shippingAddress?.email}</p>
                <p className="text-gray-600">{orderDetails.shippingAddress?.phone}</p>
                <p className="text-gray-600 mt-2">
                  {orderDetails.shippingAddress?.address}<br />
                  {orderDetails.shippingAddress?.city}, {orderDetails.shippingAddress?.division} {orderDetails.shippingAddress?.postalCode}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaFileInvoice className="mr-2 text-indigo-600" />
                Payment Information
              </h3>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {orderDetails.paymentMethod?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium capitalize">
                    {orderDetails.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Confirmation Notice */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Confirmation Email Sent</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    We've sent an order confirmation email to <span className="font-semibold">{orderDetails.shippingAddress?.email}</span>. 
                    Please check your inbox for order details and tracking information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to={`/orders/${orderDetails._id}`}
            className="btn-primary text-center"
          >
            <FaTruck className="inline mr-2" />
            Track Order
          </Link>
          
          <Link 
            to="/products"
            className="btn-secondary text-center"
          >
            Continue Shopping
          </Link>
          
          <Link 
            to="/orders"
            className="btn-secondary text-center"
          >
            View All Orders
          </Link>
        </div>

        {/* What's Next */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">What Happens Next?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Order Confirmation</h4>
              <p className="text-sm text-gray-600">
                We'll review and confirm your order within 24 hours.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Packaging</h4>
              <p className="text-sm text-gray-600">
                Your items will be carefully packaged and prepared for shipping.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Delivery</h4>
              <p className="text-sm text-gray-600">
                Your order will be delivered to your doorstep soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
