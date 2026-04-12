import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setAccessToken } = useAuthStore();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResendOTP = async () => {
    if (!formData.email.trim()) {
      toast.error('Please enter your email first');
      return;
    }

    try {
      setResending(true);
      await authService.forgotPassword(formData.email.trim().toLowerCase());
      toast.success('New OTP sent to your email');
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.otp.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.otp.trim().length !== 6 || !/^\d{6}$/.test(formData.otp.trim())) {
      toast.error('OTP must be exactly 6 digits');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.resetPasswordWithOTP({
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp.trim(),
        password: formData.password
      });

      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      toast.success('Password reset successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-center mb-2">Reset Password</h2>
          <p className="text-center text-gray-600 mb-8">Confirm reset with email OTP</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                required
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">OTP</label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={onChange}
                required
                maxLength={6}
                className="input-field"
                placeholder="Enter 6-digit OTP"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  required
                  minLength={6}
                  className="input-field pr-16"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={onChange}
                  required
                  minLength={6}
                  className="input-field pr-16"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resending}
            className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-md disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>

          <p className="text-center mt-6 text-gray-600">
            Back to{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
