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
          const price = item.discountPrice > 0 ? item.discountPrice : item.price || 0;
          return total + (price * item.quantity);
        }, 0);

        set({ cartCount: count, cartTotal: totalAmount });
      },

      // Set authentication status
      setAuthenticated: async (status) => {
        const wasAuthenticated = get().isAuthenticated;
        const guestItemsToSync = !wasAuthenticated && status ? [...get().cartItems] : [];

        set({ isAuthenticated: status });

        if (status) {
          try {
            // If user added items while logged out, merge them into backend cart on login.
            if (guestItemsToSync.length > 0) {
              await api.post('/cart/sync', { items: guestItemsToSync });
            }
          } catch (error) {
            console.error('Error syncing guest cart on login:', error);
          }

          await get().fetchCartFromBackend();
          return;
        }

        // Clear cart only on real logout transition (authenticated -> guest).
        if (wasAuthenticated) {
          set({ cartItems: [], cartCount: 0, cartTotal: 0 });
        } else {
          get().updateCartTotals(get().cartItems);
        }
      },

      // Fetch cart from backend
      fetchCartFromBackend: async (silent = false) => {
        try {
          if (!silent) {
            set({ cartLoading: true });
          }
          const token = localStorage.getItem('token');

          if (!token) {
            if (!silent) {
              set({ cartLoading: false });
            }
            return;
          }

          const response = await api.get('/cart');

          if (response.data.success) {
            const items = response.data.data.items.map(item => ({
              _id: item.product._id,
              name: item.product.name,
              price: item.product.price,
              discountPrice: item.product.discountPrice,
              images: item.product.images,
              quantity: item.quantity
            }));

            set({ cartItems: items });
            get().updateCartTotals(items);
          }
        } catch (error) {
          console.error('Error fetching cart:', error);
          if (error.response?.status !== 401 && !silent) {
            toast.error('Failed to load cart');
          }
        } finally {
          if (!silent) {
            set({ cartLoading: false });
          }
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
              // Silent refresh - update cart without loading state
              await get().fetchCartFromBackend(true);
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

          // Optimistic update - update UI immediately
          const updatedItems = cartItems.map(item =>
            item._id === productId ? { ...item, quantity } : item
          );
          set({ cartItems: updatedItems });
          get().updateCartTotals(updatedItems);

          if (isAuthenticated) {
            // Sync with backend in background
            api.put('/cart/update', {
              productId,
              quantity
            }).catch(error => {
              // Revert on error
              console.error('Error updating cart:', error);
              set({ cartItems });
              get().updateCartTotals(cartItems);
              toast.error('Failed to update cart');
            });
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
          
          // Store original items for potential rollback
          const originalItems = cartItems;

          // Optimistic update - update UI immediately
          const updatedItems = cartItems.filter(item => item._id !== productId);
          set({ cartItems: updatedItems });
          get().updateCartTotals(updatedItems);
          toast.success('Item removed from cart');

          if (isAuthenticated) {
            // Sync with backend in background
            api.delete(`/cart/remove/${productId}`).catch(error => {
              // Revert on error
              console.error('Error removing from cart:', error);
              set({ cartItems: originalItems });
              get().updateCartTotals(originalItems);
              toast.error('Failed to remove item from cart');
            });
          }
        } catch (error) {
          console.error('Error removing from cart:', error);
          toast.error('Failed to remove item from cart');
        }
      },

      // Clear cart
      clearCart: async () => {
        try {
          const { isAuthenticated, cartItems } = get();
          
          // Store original items for potential rollback
          const originalItems = cartItems;
          const originalCount = get().cartCount;
          const originalTotal = get().cartTotal;

          // Optimistic update - clear UI immediately
          set({ cartItems: [], cartCount: 0, cartTotal: 0 });
          toast.success('Cart cleared');

          if (isAuthenticated) {
            // Sync with backend in background
            api.delete('/cart/clear').catch(error => {
              // Revert on error
              console.error('Error clearing cart:', error);
              set({ cartItems: originalItems, cartCount: originalCount, cartTotal: originalTotal });
              toast.error('Failed to clear cart');
            });
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
  window.updateCartAuthStatus = async (isAuthenticated) => {
    await useCartStore.getState().setAuthenticated(isAuthenticated);
  };
}
