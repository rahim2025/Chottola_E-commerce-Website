import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Auth Method Selector Page
 * Allows users to choose between email/password and phone/OTP authentication
 */
const AuthMethodSelector = ({ mode = 'signup' }) => {
  const navigate = useNavigate();

  const handleSelectEmail = () => {
    if (mode === 'signup') {
      navigate('/signup/email');
    } else {
      navigate('/login/email');
    }
  };

  const handleSelectPhone = () => {
    if (mode === 'signup') {
      navigate('/signup/phone');
    } else {
      navigate('/login/phone');
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isSignup ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-xl text-gray-600">
            {isSignup 
              ? 'Choose how you want to sign up'
              : 'Choose how you want to log in'}
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Email Option */}
          <div
            onClick={handleSelectEmail}
            className="group cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              ✉️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Email</h2>
            <p className="text-gray-600 mb-6">
              {isSignup
                ? 'Sign up with your email address and password'
                : 'Log in with your email and password'}
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                Easy to remember
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                Password recovery available
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                Secure password-based auth
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 group-hover:shadow-md">
              Continue with Email
            </button>
          </div>

          {/* Phone Option */}
          <div
            onClick={handleSelectPhone}
            className="group cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 border-2 border-green-200"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              📱
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Phone</h2>
            <p className="text-gray-600 mb-6">
              {isSignup
                ? 'Sign up with your phone number using OTP'
                : 'Log in with your phone number using OTP'}
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                Fast & secure OTP verification
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                No password needed
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold">✓</span>
                Add email later if needed
              </div>
            </div>

            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition duration-200 group-hover:shadow-md">
              Continue with Phone
            </button>

            {/* Badge */}
            <div className="mt-4 inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              🔥 Recommended
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Why Choose Phone OTP?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="flex-shrink-0 text-blue-600 font-bold">✓</span>
              <span>No password to remember or reset</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 text-blue-600 font-bold">✓</span>
              <span>Quick verification in seconds</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 text-blue-600 font-bold">✓</span>
              <span>Add email address anytime from your profile</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 text-blue-600 font-bold">✓</span>
              <span>Extra layer of security with OTP verification</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthMethodSelector;
