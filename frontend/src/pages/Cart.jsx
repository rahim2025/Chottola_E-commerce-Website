import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTrash, FaMinus, FaPlus, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '../hooks/useCart';
import Loader from '../components/common/Loader';

const Cart = () => {
  const { 
    cartItems, 
    cartLoading,
    removeFromCart, 
    updateCartItem, 
    getCartTotal, 
    clearCart,
    cartTotal,
    cartCount
  } = useCart();
  const navigate = useNavigate();

  const handleUpdateQuantity = async (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      await updateCartItem(productId, newQuantity);
    }
  };

  const handleRemove = async (productId, productName) => {
    await removeFromCart(productId);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartLoading) {
    return <Loader />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <FaShoppingBag className="mx-auto text-6xl text-gray-400 mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <FaShoppingBag className="mr-2" />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Calculate delivery fee - static for cart, dynamic in checkout
  const deliveryFee = 60; // Default Dhaka rate, actual rate calculated at checkout
  const finalTotal = cartTotal + deliveryFee;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cart Items ({cartCount})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => {
                  const price = item.discountPrice > 0 ? item.discountPrice : item.price || 0;
                  const originalPrice = item.price || 0;
                  const hasDiscount = item.discountPrice > 0 && item.discountPrice < originalPrice;
                  
                  return (
                    <div key={item._id} className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                            src={item.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.name}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {item.name}
                          </h3>
                          {item.sku && (
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          )}
                          
                          <div className="flex items-center mt-1">
                            <span className="text-lg font-semibold text-gray-900">
                              ৳{price.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ৳{originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                            className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition duration-200"
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus className="w-3 h-3 text-gray-600" />
                          </button>
                          
                          <span className="text-lg font-medium text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                            className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition duration-200"
                          >
                            <FaPlus className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ৳{(price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemove(item._id, item.name)}
                            className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center"
                          >
                            <FaTrash className="w-3 h-3 mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartCount} items)</span>
                    <span>৳{cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>৳{deliveryFee.toFixed(2)}</span>
                  </div>

                  {/* Delivery Info */}
                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg mt-3">
                    <div className="font-medium text-blue-900 mb-1">📦 Delivery Charges:</div>
                    <ul className="space-y-1 ml-4">
                      <li>• Inside Dhaka: ৳60</li>
                      <li className="text-green-600 font-medium">• Uttara: Free!</li>
                      <li>• Outside Dhaka: ৳120</li>
                    </ul>
                    <p className="mt-2 text-gray-600">*Exact charge calculated at checkout</p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>৳{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition duration-200"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/products"
                  className="block w-full mt-3 text-center text-indigo-600 hover:text-indigo-800 font-medium py-3"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
