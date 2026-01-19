import React, { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Load cart from localStorage on mount (for unauthenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
        updateCartTotals(items);
      }
    }
  }, [isAuthenticated]);

  // Load cart from backend for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartFromBackend();
    }
  }, [isAuthenticated]);

  // Save cart to localStorage for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      updateCartTotals(cartItems);
    }
  }, [cartItems, isAuthenticated]);

  // Update cart totals
  const updateCartTotals = (items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = items.reduce((total, item) => {
      const price = item.pricing?.discountPrice || item.pricing?.sellingPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
    
    setCartCount(count);
    setCartTotal(totalAmount);
  };

  // Fetch cart from backend
  const fetchCartFromBackend = async () => {
    try {
      setCartLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) return;

      const response = await api.get('/cart');

      if (response.data.success) {
        const items = response.data.data.items.map(item => ({
          _id: item.product._id,
          name: item.product.name,
          pricing: item.product.pricing,
          images: item.product.images,
          sku: item.product.sku,
          quantity: item.quantity,
          price: item.price,
          discountPrice: item.discountPrice
        }));
        
        setCartItems(items);
        updateCartTotals(items);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Don't show error toast if user is not logged in
      if (error.response?.status !== 401) {
        toast.error('Failed to load cart');
      }
    } finally {
      setCartLoading(false);
    }
  };

  // Sync localStorage cart with backend when user logs in
  const syncCartWithBackend = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || cartItems.length === 0) return;

      const response = await api.post('/cart/sync', { 
        items: cartItems 
      });

      if (response.data.success) {
        // Clear localStorage cart and fetch from backend
        localStorage.removeItem('cart');
        await fetchCartFromBackend();
        toast.success('Cart synchronized successfully!');
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    try {
      if (isAuthenticated) {
        // Add to backend
        const token = localStorage.getItem('token');
        const response = await api.post('/cart/add', {
          productId: product._id,
          quantity
        });

        if (response.data.success) {
          await fetchCartFromBackend();
          toast.success(`${product.name} added to cart!`);
        } else {
          toast.error(response.data.message || 'Failed to add item to cart');
        }
      } else {
        // Add to localStorage
        const existingItem = cartItems.find(item => item._id === product._id);

        if (existingItem) {
          const updatedItems = cartItems.map(item =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          setCartItems(updatedItems);
        } else {
          setCartItems([...cartItems, { ...product, quantity }]);
        }
        toast.success(`${product.name} added to cart!`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      if (isAuthenticated) {
        // Remove from backend
        const token = localStorage.getItem('token');
        const response = await api.delete(`/cart/remove/${productId}`);

        if (response.data.success) {
          await fetchCartFromBackend();
          toast.success('Item removed from cart');
        } else {
          toast.error('Failed to remove item from cart');
        }
      } else {
        // Remove from localStorage
        const updatedItems = cartItems.filter(item => item._id !== productId);
        setCartItems(updatedItems);
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      if (isAuthenticated) {
        // Update in backend
        const token = localStorage.getItem('token');
        const response = await api.put('/cart/update', {
          productId,
          quantity
        });

        if (response.data.success) {
          await fetchCartFromBackend();
        } else {
          toast.error(response.data.message || 'Failed to update quantity');
        }
      } else {
        // Update in localStorage
        const updatedItems = cartItems.map(item =>
          item._id === productId
            ? { ...item, quantity }
            : item
        );
        setCartItems(updatedItems);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        // Clear backend cart
        const token = localStorage.getItem('token');
        const response = await api.delete('/cart/clear');

        if (response.data.success) {
          setCartItems([]);
          setCartCount(0);
          setCartTotal(0);
          toast.success('Cart cleared');
        } else {
          toast.error('Failed to clear cart');
        }
      } else {
        // Clear localStorage cart
        setCartItems([]);
        localStorage.removeItem('cart');
        toast.success('Cart cleared');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  // Get cart total
  const getCartTotal = () => cartTotal;

  // Get cart count
  const getCartCount = () => cartCount;

  // Update authentication status (called from AuthContext)
  const updateAuthStatus = (authenticated) => {
    setIsAuthenticated(authenticated);
    if (authenticated && cartItems.length > 0) {
      // Sync localStorage cart with backend when user logs in
      setTimeout(syncCartWithBackend, 1000);
    } else if (!authenticated) {
      // Clear cart when user logs out
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
    }
  };

  // Expose updateAuthStatus globally for AuthContext
  useEffect(() => {
    window.updateCartAuthStatus = updateAuthStatus;
    return () => {
      delete window.updateCartAuthStatus;
    };
  }, [cartItems]);

  const value = {
    cartItems,
    cartLoading,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    updateAuthStatus,
    syncCartWithBackend,
    fetchCartFromBackend
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
