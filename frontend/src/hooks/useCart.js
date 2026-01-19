import { useCartStore } from '../stores/cartStore';

export const useCart = () => {
  const cartItems = useCartStore((state) => state.cartItems);
  const cartLoading = useCartStore((state) => state.cartLoading);
  const cartCount = useCartStore((state) => state.cartCount);
  const cartTotal = useCartStore((state) => state.cartTotal);
  const addToCart = useCartStore((state) => state.addToCart);
  const updateCartItem = useCartStore((state) => state.updateCartItem);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const getCartCount = useCartStore((state) => state.getCartCount);
  const getCartTotal = useCartStore((state) => state.getCartTotal);
  const fetchCartFromBackend = useCartStore((state) => state.fetchCartFromBackend);
  const syncCartWithBackend = useCartStore((state) => state.syncCartWithBackend);

  return {
    cartItems,
    cartLoading,
    cartCount,
    cartTotal,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount,
    getCartTotal,
    fetchCartFromBackend,
    syncCartWithBackend
  };
};
