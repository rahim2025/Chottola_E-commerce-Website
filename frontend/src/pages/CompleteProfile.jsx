import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';

/**
 * Complete Profile Page
 * Allows phone-only users to add name and/or email later
 * Accessible from user profile
 */
const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Validate email format
  const validateEmail = (emailStr) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(emailStr);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Validate inputs
      if (!name.trim() && !email.trim()) {
        throw new Error('Please provide at least a name or email address');
      }

      if (email && !validateEmail(email)) {
        throw new Error('Please provide a valid email address');
      }

      if (name && (name.length < 2 || name.length > 50)) {
        throw new Error('Name must be between 2 and 50 characters');
      }

      // Update profile
      const updates = {};
      if (name.trim()) updates.name = name.trim();
      if (email.trim()) updates.email = email.trim();

      const response = await authService.updateProfile(updates);

      if (response.success) {
        updateUser(response.data.user);
        setSuccess(true);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    navigate('/profile', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">
            {user?.name ? 'Update your profile information' : 'Help us know more about you'}
          </p>
        </div>

        {success ? (
          // Success Message
          <div className="text-center py-8">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Profile Updated!</h2>
            <p className="text-gray-600 mb-6">Redirecting to your profile...</p>
            <div className="animate-pulse">
              <div className="h-2 bg-green-200 rounded-full"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name {!user?.name && '(Optional)'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user?.name ? user.name : "Enter your full name"}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {name.length > 0 && name.length <= 2
                  ? 'At least 2 characters'
                  : name.length > 50
                  ? 'Maximum 50 characters'
                  : 'This helps us personalize your experience'}
              </p>
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address {!user?.email && '(Optional)'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={user?.email ? user.email : "Enter your email address"}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll use this for important account notifications
              </p>
            </div>

            {/* Current Auth Method */}
            {user && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Account Status:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.phoneVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <span>✓</span> Phone Verified
                    </span>
                  )}
                  {user.emailVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <span>✓</span> Email Verified
                    </span>
                  )}
                  {user.authMethod && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Auth: {user.authMethod === 'phone' ? '📱' : '✉️'} {user.authMethod}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">⚠️ {error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || (!name.trim() && !email.trim())}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition duration-200"
              >
                {loading ? '⏳ Updating...' : 'Update Profile'}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition duration-200"
              >
                Skip for Now
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">💡 Tip:</span> You can update your profile information anytime from your profile settings.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompleteProfile;
