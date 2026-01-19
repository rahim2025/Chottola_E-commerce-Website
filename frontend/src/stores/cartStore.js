import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import api from '../services/api';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      cartLoading: false,
      cartCount: 0,
      cartTotal: 0,
      isAuthenticated: false,

      // Update cart totals
      updateCartTotals: (items) => {
        const count = items.reduce((total, item) => total + item.quantity, 0);
        const totalAmount = items.reduce((total, item) => {
          const price = item.pricing?.discountPrice || item.pricing?.sellingPrice || item.price || 0;
          return total + (price * item.quantity);
        }, 0);

        set({ cartCount: count, cartTotal: totalAmount });
      },

      // Set authentication status
      setAuthenticated: (status) => {
        set({ isAuthenticated: status });
        if (status) {
          get().fetchCartFromBackend();
        }
      },

      // Fetch cart from backend
      fetchCartFromBackend: async () => {
        try {
          set({ cartLoading: true });
          const token = localStorage.getItem('token');

          if (!token) {
            set({ cartLoading: false });
            return;
          }

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

            set({ cartItems: items });
            get().updateCartTotals(items);
          }
        } catch (error) {
          console.error('Error fetching cart:', error);
          if (error.response?.status !== 401) {
            toast.error('Failed to load cart');
          }
        } finally {
          set({ cartLoading: false });
        }
      },

      // Sync localStorage cart with backend
      syncCartWithBackend: async () => {
        try {
          const { cartItems, isAuthenticated } = get();
          const token = localStorage.getItem('token');
          
          if (!token || !isAuthenticated || cartItems.length === 0) return;

          const response = await api.post('/cart/sync', {
            items: cartItems
          });

          if (response.data.success) {
            await get().fetchCartFromBackend();
            toast.success('Cart synchronized successfully!');
          }
        } catch (error) {
          console.error('Error syncing cart:', error);
        }
      },

      // Add item to cart
      addToCart: async (product, quantity = 1) => {
        try {
          const { isAuthenticated, cartItems } = get();

          if (isAuthenticated) {
            const token = localStorage.getItem('token');
            const response = await api.post('/cart/add', {
              productId: product._id,
              quantity
            });

            if (response.data.success) {
              await get().fetchCartFromBackend();
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
              set({ cartItems: updatedItems });
              get().updateCartTotals(updatedItems);
            } else {
              const newItems = [...cartItems, { ...product, quantity }];
              set({ cartItems: newItems });
              get().updateCartTotals(newItems);
            }
            toast.success(`${product.name} added to cart!`);
          }
        } catch (error) {
          console.error('Error adding to cart:', error);
          toast.error(error.response?.data?.message || 'Failed to add item to cart');
        }
      },

      // Update cart item quantity
      updateCartItem: async (productId, quantity) => {
        try {
          const { isAuthenticated, cartItems } = get();

          if (quantity <= 0) {
            await get().removeFromCart(productId);
            return;
          }

          if (isAuthenticated) {
            const response = await api.put('/cart/update', {
              productId,
              quantity
            });

            if (response.data.success) {
              await get().fetchCartFromBackend();
            }
          } else {
            const updatedItems = cartItems.map(item =>
              item._id === productId ? { ...item, quantity } : item
            );
            set({ cartItems: updatedItems });
            get().updateCartTotals(updatedItems);
          }
        } catch (error) {
          console.error('Error updating cart:', error);
          toast.error('Failed to update cart');
        }
      },

      // Remove item from cart
      removeFromCart: async (productId) => {
        try {
          const { isAuthenticated, cartItems } = get();

          if (isAuthenticated) {
            const response = await api.delete(`/cart/remove/${productId}`);

            if (response.data.success) {
              await get().fetchCartFromBackend();
              toast.success('Item removed from cart');
            }
          } else {
            const updatedItems = cartItems.filter(item => item._id !== productId);
            set({ cartItems: updatedItems });
            get().updateCartTotals(updatedItems);
            toast.success('Item removed from cart');
          }
        } catch (error) {
          console.error('Error removing from cart:', error);
          toast.error('Failed to remove item from cart');
        }
      },

      // Clear cart
      clearCart: async () => {
        try {
          const { isAuthenticated } = get();

          if (isAuthenticated) {
            const response = await api.delete('/cart/clear');

            if (response.data.success) {
              set({ cartItems: [], cartCount: 0, cartTotal: 0 });
              toast.success('Cart cleared');
            }
          } else {
            set({ cartItems: [], cartCount: 0, cartTotal: 0 });
            toast.success('Cart cleared');
          }
        } catch (error) {
          console.error('Error clearing cart:', error);
          toast.error('Failed to clear cart');
        }
      },

      // Get cart count
      getCartCount: () => {
        return get().cartCount;
      },

      // Get cart total
      getCartTotal: () => {
        return get().cartTotal;
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cartItems: state.isAuthenticated ? [] : state.cartItems
      })
    }
  )
);

// Setup global function for auth updates
if (typeof window !== 'undefined') {
  window.updateCartAuthStatus = (isAuthenticated) => {
    useCartStore.getState().setAuthenticated(isAuthenticated);
  };
}
