import api from './api';

export const authService = {
  // ============ Email/Password Auth ============
  
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('token', response.data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  sendSignupOTP: async (email) => {
    try {
      const response = await api.post('/auth/send-email-otp', { email, purpose: 'signup' });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send signup OTP';
      throw new Error(message);
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success && response.data.data.accessToken) {
        localStorage.setItem('token', response.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('AuthService login error:', error);
      throw error;
    }
  },

  // ============ OTP & Phone Auth ============
  
  // Send OTP to phone
  sendOTP: async (phone) => {
    try {
      const response = await api.post('/auth/send-otp', { phone });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      throw new Error(message);
    }
  },

  // Verify OTP code
  verifyOTP: async (phone, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { phone, otp });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid OTP';
      throw new Error(message);
    }
  },

  // Resend OTP
  resendOTP: async (phone) => {
    try {
      const response = await api.post('/auth/resend-otp', { phone });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      throw new Error(message);
    }
  },

  // Register with phone
  registerWithPhone: async (phone, otp, name = null) => {
    try {
      const response = await api.post('/auth/register/phone', {
        phone,
        otp,
        name
      });
      
      if (response.data.success && response.data.data.accessToken) {
        localStorage.setItem('token', response.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  },

  // Login with phone
  loginWithPhone: async (phone, otp, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login/phone', {
        phone,
        otp,
        rememberMe
      });
      
      if (response.data.success && response.data.data.accessToken) {
        localStorage.setItem('token', response.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  },

  // Update user profile
  updateProfile: async (updates) => {
    try {
      const response = await api.put('/auth/profile', updates);
      
      if (response.data.success && response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      throw new Error(message);
    }
  },

  // ============ Password Reset via Email OTP ============

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send password reset OTP';
      throw new Error(message);
    }
  },

  resetPasswordWithOTP: async ({ email, otp, password }) => {
    try {
      const response = await api.put('/auth/reset-password', { email, otp, password });

      if (response.data.success && response.data.data?.accessToken) {
        localStorage.setItem('token', response.data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      throw new Error(message);
    }
  },

  // ============ Common Methods ============

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Get user from local storage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  }
};

export default authService;

