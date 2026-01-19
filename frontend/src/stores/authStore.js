import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,

      // Initialize auth state
      initialize: () => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          set({
            user: currentUser,
            isAuthenticated: true,
            isAdmin: currentUser.role === 'admin' || currentUser.role === 'super-admin' || currentUser.role === 'moderator'
          });
        }
      },

      // Login
      login: async (credentials) => {
        try {
          set({ loading: true });
          const data = await authService.login(credentials);
          const user = data.data.user;
          
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin' || user.role === 'super-admin' || user.role === 'moderator',
            loading: false
          });

          // Notify cart store about auth change
          if (window.updateCartAuthStatus) {
            window.updateCartAuthStatus(true);
          }

          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Register
      register: async (userData) => {
        try {
          set({ loading: true });
          const data = await authService.register(userData);
          const user = data.data.user;
          
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin' || user.role === 'super-admin' || user.role === 'moderator',
            loading: false
          });

          // Notify cart store about auth change
          if (window.updateCartAuthStatus) {
            window.updateCartAuthStatus(true);
          }

          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Logout
      logout: () => {
        authService.logout();
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false
        });

        // Notify cart store about auth change
        if (window.updateCartAuthStatus) {
          window.updateCartAuthStatus(false);
        }
      },

      // Update user
      updateUser: (updatedUser) => {
        const currentUser = get().user;
        const newUser = { ...currentUser, ...updatedUser };
        
        set({
          user: newUser,
          isAdmin: newUser.role === 'admin' || newUser.role === 'super-admin' || newUser.role === 'moderator'
        });

        // Update localStorage
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          localStorage.setItem('user', JSON.stringify(newUser));
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin
      })
    }
  )
);
