import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OTPInput from '../components/OTPInput';
import authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';

/**
 * Phone Login Page
 * Allows users to login with phone number and OTP
 */
const PhoneLogin = () => {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  const [step, setStep] = useState('phone'); // 'phone', 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(null);

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (!value.startsWith('+')) {
      value = '+' + value;
    }

    setPhone(value);
    setError(null);
  };

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!phone || phone.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      const response = await authService.sendOTP(phone);
      
      setStep('otp');
      setOtp('');
      setOtpExpiry(Date.now() + response.expiresIn * 1000);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and login
  const handleVerifyOTP = async (code) => {
    if (code.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      // First verify the OTP
      await authService.verifyOTP(phone, code);
      
      // Then login with phone
      const response = await authService.loginWithPhone(phone, code, rememberMe);
      
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setError(null);
    setLoading(true);

    try {
      const response = await authService.sendOTP(phone);
      
      setOtp('');
      setOtpExpiry(Date.now() + response.expiresIn * 1000);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  // OTP Expiry countdown
  useEffect(() => {
    if (!otpExpiry) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, otpExpiry - Date.now());
      
      if (remaining <= 0) {
        setOtp('');
        setStep('phone');
        setError('OTP expired. Please request a new one.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiry]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login with your phone number</p>
        </div>

        {/* Phone Step */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+8801234567890"
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {phone && (
                  <span className="absolute right-3 top-3 text-green-600 text-lg">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Include country code (e.g., +8801234567890 for Bangladesh)
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition duration-200"
            >
              {loading ? '⏳ Sending...' : 'Send OTP'}
            </button>

            <div className="my-4 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Link
              to="/signup"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-lg transition duration-200"
            >
              Create New Account
            </Link>

            <p className="text-center text-sm text-gray-600 mt-4">
              Login with email?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Use Email & Password
              </Link>
            </p>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Verification Code
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code sent to <strong>{phone}</strong>
              </p>
              
              <OTPInput
                value={otp}
                onChange={setOtp}
                onComplete={handleVerifyOTP}
                disabled={loading}
                error={error}
              />

              <p className="text-xs text-gray-500 mt-4 text-center">
                {otpExpiry && (
                  <>
                    Expires in{' '}
                    {Math.ceil((otpExpiry - Date.now()) / 1000)} seconds
                  </>
                )}
              </p>
            </div>

            {/* Remember Me */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Remember me for 30 days</span>
              </label>
            </div>

            {/* Resend Button */}
            <div className="mb-6 text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-gray-600">
                  Resend OTP in{' '}
                  <span className="font-medium text-gray-900">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Didn't receive code? Resend OTP
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError(null);
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-lg transition duration-200"
            >
              ← Change Phone Number
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Prefer email login?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Use Email & Password
              </Link>
            </p>
          </form>
        )}

        {/* Progress Indicator */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-center gap-2">
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                step === 'phone' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            ></div>
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                step === 'otp' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneLogin;
