import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      // OTP-related state
      otpData: null,

      // Initialize auth state
      initialize: () => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          set({
            user: currentUser,
            isAuthenticated: true,
            isAdmin: currentUser.role === 'admin'
          });
        }
      },

      // Set access token (for OTP flows)
      setAccessToken: (token) => {
        set({ accessToken: token });
        if (token) {
          localStorage.setItem('token', token);
        }
      },

      // Set user (for OTP flows)
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isAdmin: user ? user.role === 'admin' : false
        });
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      },

      // Login
      login: async (credentials) => {
        try {
          set({ loading: true });
          const data = await authService.login(credentials);
          
          if (!data.success) {
            throw new Error(data.message || 'Login failed');
          }
          
          const user = data.data.user;
          const isAdminUser = user.role === 'admin';
          
          set({
            user,
            accessToken: data.data.accessToken,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            loading: false
          });

          // Notify cart store about auth change
          if (window.updateCartAuthStatus) {
            window.updateCartAuthStatus(!isAdminUser);
          }

          return data;
        } catch (error) {
          set({ loading: false });
          console.error('Auth store login error:', error);
          throw error;
        }
      },

      // Login with phone
      loginWithPhone: async (phone, otp, rememberMe = false) => {
        try {
          set({ loading: true });
          const data = await authService.loginWithPhone(phone, otp, rememberMe);
          
          if (!data.success) {
            throw new Error(data.message || 'Login failed');
          }
          
          const user = data.data.user;
          const isAdminUser = user.role === 'admin';
          
          set({
            user,
            accessToken: data.data.accessToken,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            otpData: null,
            loading: false
          });

          if (window.updateCartAuthStatus) {
            window.updateCartAuthStatus(!isAdminUser);
          }

          return data;
        } catch (error) {
          set({ loading: false });
          console.error('Phone login error:', error);
          throw error;
        }
      },

      // Register
      register: async (userData) => {
        try {
          set({ loading: true });
          const data = await authService.register(userData);
          const user = data.data.user;
          const isAdminUser = user.role === 'admin';
          
          set({
            user,
            accessToken: data.data.accessToken,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            loading: false
          });

          if (window.updateCartAuthStatus) {
            window.updateCartAuthStatus(!isAdminUser);
          }

          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Register with phone
      registerWithPhone: async (phone, otp, name = null) => {
        try {
          set({ loading: true });
          const data = await authService.registerWithPhone(phone, otp, name);
          const user = data.data.user;
          
          set({
            user,
            accessToken: data.data.accessToken,
            isAuthenticated: true,
            isAdmin: false,
            otpData: null,
            loading: false
          });

          if (window.updateCartAuthStatus) {
            window.updateCartAuthStatus(false);
          }

          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Send OTP
      sendOTP: async (phone) => {
        try {
          set({ loading: true });
          const data = await authService.sendOTP(phone);
          
          set({
            otpData: {
              phone,
              sentAt: Date.now(),
              expiresIn: data.expiresIn
            },
            loading: false
          });

          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Verify OTP
      verifyOTP: async (phone, otp) => {
        try {
          set({ loading: true });
          const data = await authService.verifyOTP(phone, otp);
          
          set({
            otpData: {
              ...get().otpData,
              verified: true,
              verifiedAt: Date.now()
            },
            loading: false
          });

          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Clear OTP data
      clearOTPData: () => {
        set({ otpData: null });
      },

      // Logout
      logout: () => {
        authService.logout();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isAdmin: false,
          otpData: null
        });

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
          isAdmin: newUser.role === 'admin'
        });

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
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin
      })
    }
  )
);

