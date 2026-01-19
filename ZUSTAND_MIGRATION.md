# Zustand Migration Guide

## Overview
The Chottola e-commerce application has been migrated from React Context API to Zustand for state management.

## What Changed

### ✅ Removed
- `frontend/src/context/AuthContext.jsx` - No longer needed
- `frontend/src/context/CartContext.jsx` - No longer needed
- Context Providers in App.jsx

### ✅ Added
- `frontend/src/stores/authStore.js` - Zustand auth store
- `frontend/src/stores/cartStore.js` - Zustand cart store
- `zustand` package dependency

### ✅ Updated
- `frontend/src/hooks/useAuth.js` - Now uses Zustand store
- `frontend/src/hooks/useCart.js` - Now uses Zustand store
- `frontend/src/App.jsx` - Removed providers, added store initialization
- `frontend/package.json` - Added zustand dependency

## Installation

Run the following command to install Zustand:

```bash
cd frontend
npm install zustand
```

## Benefits of Zustand

### 1. **Simpler API**
- No need for Context Providers
- Less boilerplate code
- Direct store access

### 2. **Better Performance**
- Only re-renders components that use changed state
- No unnecessary re-renders from context updates
- Smaller bundle size

### 3. **Persistence Built-in**
- Automatic localStorage synchronization
- State persists across page refreshes
- Configurable persistence options

### 4. **DevTools Support**
- Redux DevTools compatible
- Easy debugging
- Time-travel debugging

### 5. **TypeScript Ready**
- Full TypeScript support
- Type inference out of the box

## How to Use

### Authentication Store

```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use exactly as before - no changes needed!
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <button onClick={() => login(credentials)}>Login</button>
      )}
    </div>
  );
}
```

### Cart Store

```javascript
import { useCart } from '../hooks/useCart';

function MyComponent() {
  const { cartItems, addToCart, removeFromCart, cartCount } = useCart();

  // Use exactly as before - no changes needed!
  return (
    <div>
      <p>Cart Items: {cartCount}</p>
      {cartItems.map(item => (
        <div key={item._id}>
          {item.name}
          <button onClick={() => removeFromCart(item._id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

## Direct Store Access (Optional)

You can also access stores directly without hooks:

```javascript
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

// Get state
const user = useAuthStore.getState().user;
const cartItems = useCartStore.getState().cartItems;

// Call actions
useAuthStore.getState().logout();
useCartStore.getState().addToCart(product, 1);
```

## Store Structure

### Auth Store (`authStore.js`)

**State:**
- `user` - Current user object
- `loading` - Loading state
- `isAuthenticated` - Boolean authentication status
- `isAdmin` - Boolean admin status

**Actions:**
- `initialize()` - Initialize auth from localStorage
- `login(credentials)` - Login user
- `register(userData)` - Register new user
- `logout()` - Logout user
- `updateUser(data)` - Update user profile

### Cart Store (`cartStore.js`)

**State:**
- `cartItems` - Array of cart items
- `cartLoading` - Loading state
- `cartCount` - Total item count
- `cartTotal` - Total cart value
- `isAuthenticated` - Auth status for cart sync

**Actions:**
- `addToCart(product, quantity)` - Add item to cart
- `updateCartItem(productId, quantity)` - Update item quantity
- `removeFromCart(productId)` - Remove item from cart
- `clearCart()` - Clear all items
- `fetchCartFromBackend()` - Sync cart from backend
- `syncCartWithBackend()` - Sync local cart to backend
- `getCartCount()` - Get cart count
- `getCartTotal()` - Get cart total

## Persistence Configuration

Both stores use Zustand's persist middleware:

### Auth Store Persistence
```javascript
{
  name: 'auth-storage',
  partialize: (state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin
  })
}
```

### Cart Store Persistence
```javascript
{
  name: 'cart-storage',
  partialize: (state) => ({
    cartItems: state.isAuthenticated ? [] : state.cartItems
  })
}
```

**Note:** Cart items are only persisted for unauthenticated users. Authenticated users' carts are fetched from the backend.

## Migration Checklist

- [x] Install zustand package
- [x] Create authStore.js
- [x] Create cartStore.js
- [x] Update useAuth hook
- [x] Update useCart hook
- [x] Update App.jsx
- [x] Remove old Context files (optional)
- [x] Test authentication flow
- [x] Test cart functionality
- [x] Test persistence

## Backwards Compatibility

**Good News:** The custom hooks (`useAuth` and `useCart`) maintain the same API, so **no component changes are required!**

All existing components will work without modification because:
- Hook signatures remain the same
- Return values are identical
- Function names unchanged

## Testing

After migration, test these features:

1. **Authentication:**
   - [ ] Login
   - [ ] Register
   - [ ] Logout
   - [ ] Auto-login on refresh
   - [ ] Admin access

2. **Cart:**
   - [ ] Add to cart (guest)
   - [ ] Add to cart (authenticated)
   - [ ] Update quantity
   - [ ] Remove items
   - [ ] Clear cart
   - [ ] Cart persistence
   - [ ] Cart sync on login

## Troubleshooting

### Issue: Store not persisting
**Solution:** Check localStorage in DevTools. Clear if corrupted:
```javascript
localStorage.removeItem('auth-storage');
localStorage.removeItem('cart-storage');
```

### Issue: State not updating
**Solution:** Ensure you're calling actions, not mutating state:
```javascript
// ❌ Wrong
user.name = 'New Name';

// ✅ Correct
updateUser({ name: 'New Name' });
```

### Issue: Cart not syncing
**Solution:** Check authentication status and backend connection:
```javascript
const isAuth = useAuthStore.getState().isAuthenticated;
console.log('Authenticated:', isAuth);
```

## Performance Tips

1. **Selective subscriptions** - Only subscribe to needed state:
```javascript
// ❌ Re-renders on any auth change
const auth = useAuth();

// ✅ Only re-renders when user changes
const user = useAuthStore((state) => state.user);
```

2. **Batch actions** - Zustand batches updates automatically

3. **Avoid inline selectors** - Use stable selectors:
```javascript
// ❌ Creates new function each render
const user = useAuthStore((state) => ({ name: state.user.name }));

// ✅ Stable selector
const selectUserName = (state) => state.user?.name;
const userName = useAuthStore(selectUserName);
```

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Recipes](https://docs.pmnd.rs/zustand/guides/recipes)
- [DevTools Setup](https://docs.pmnd.rs/zustand/guides/devtools)

---

**Migration Date:** January 20, 2026  
**Version:** 2.0.0
