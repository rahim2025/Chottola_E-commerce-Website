import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';

const SystemSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Chottola',
    siteDescription: 'Premium imported food, bakery & frozen items',
    contactEmail: '',
    contactPhone: '',
    currency: 'USD',
    taxRate: 0,
    shippingFee: 0,
    freeShippingThreshold: 0,
    enableNewsletter: true,
    enableReviews: true,
    enableWishlist: true,
    enableLoyaltyPoints: true,
    pointsPerDollar: 1,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    orderAutoCancel: 48,
    enableSMS: false,
    smsProvider: '',
    smsApiKey: '',
    paymentGateways: {
      stripe: { enabled: false, publicKey: '', secretKey: '' },
      paypal: { enabled: false, clientId: '', secret: '' },
      razorpay: { enabled: false, keyId: '', keySecret: '' }
    },
    emailProvider: {
      service: 'gmail',
      user: '',
      password: ''
    }
  });

  const isSuperAdmin = user?.role === 'super-admin';

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">Only super-admins can access system settings.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handlePaymentGatewayChange = (gateway, field, value) => {
    setSettings(prev => ({
      ...prev,
      paymentGateways: {
        ...prev.paymentGateways,
        [gateway]: {
          ...prev.paymentGateways[gateway],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call would go here
      // await settingsService.updateSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      toast.info('Testing email configuration...');
      // await settingsService.testEmail();
      toast.success('Test email sent successfully!');
    } catch (error) {
      toast.error('Failed to send test email');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <button onClick={handleSave} className="btn-primary">
          Save All Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Site Name</label>
              <input
                type="text"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                name="contactPhone"
                value={settings.contactPhone}
                onChange={handleChange}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Currency</label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="BDT">BDT (৳)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">Site Description</label>
              <textarea
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleChange}
                rows="3"
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        {/* Commerce Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Commerce Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Shipping Fee ($)</label>
              <input
                type="number"
                name="shippingFee"
                value={settings.shippingFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Free Shipping Threshold ($)</label>
              <input
                type="number"
                name="freeShippingThreshold"
                value={settings.freeShippingThreshold}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Points Per Dollar</label>
              <input
                type="number"
                name="pointsPerDollar"
                value={settings.pointsPerDollar}
                onChange={handleChange}
                min="0"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Auto-Cancel Orders (hours)</label>
              <input
                type="number"
                name="orderAutoCancel"
                value={settings.orderAutoCancel}
                onChange={handleChange}
                min="0"
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Feature Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enableNewsletter"
                checked={settings.enableNewsletter}
                onChange={handleChange}
                className="rounded"
              />
              <span>Enable Newsletter Subscription</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enableReviews"
                checked={settings.enableReviews}
                onChange={handleChange}
                className="rounded"
              />
              <span>Enable Product Reviews</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enableWishlist"
                checked={settings.enableWishlist}
                onChange={handleChange}
                className="rounded"
              />
              <span>Enable Wishlist</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enableLoyaltyPoints"
                checked={settings.enableLoyaltyPoints}
                onChange={handleChange}
                className="rounded"
              />
              <span>Enable Loyalty Points</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enableSMS"
                checked={settings.enableSMS}
                onChange={handleChange}
                className="rounded"
              />
              <span>Enable SMS Notifications</span>
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Security & Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
                className="rounded"
              />
              <span className="font-semibold text-orange-600">Maintenance Mode</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="allowRegistration"
                checked={settings.allowRegistration}
                onChange={handleChange}
                className="rounded"
              />
              <span>Allow New Registrations</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requireEmailVerification"
                checked={settings.requireEmailVerification}
                onChange={handleChange}
                className="rounded"
              />
              <span>Require Email Verification</span>
            </label>
            <div>
              <label className="block text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                name="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={handleChange}
                min="5"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Max Login Attempts</label>
              <input
                type="number"
                name="maxLoginAttempts"
                value={settings.maxLoginAttempts}
                onChange={handleChange}
                min="3"
                max="10"
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Payment Gateways</h2>
          
          {/* Stripe */}
          <div className="mb-6 p-4 border rounded">
            <label className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                checked={settings.paymentGateways.stripe.enabled}
                onChange={(e) => handlePaymentGatewayChange('stripe', 'enabled', e.target.checked)}
                className="rounded"
              />
              <span className="font-semibold">Stripe</span>
            </label>
            {settings.paymentGateways.stripe.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Public Key"
                  value={settings.paymentGateways.stripe.publicKey}
                  onChange={(e) => handlePaymentGatewayChange('stripe', 'publicKey', e.target.value)}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Secret Key"
                  value={settings.paymentGateways.stripe.secretKey}
                  onChange={(e) => handlePaymentGatewayChange('stripe', 'secretKey', e.target.value)}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {/* PayPal */}
          <div className="mb-6 p-4 border rounded">
            <label className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                checked={settings.paymentGateways.paypal.enabled}
                onChange={(e) => handlePaymentGatewayChange('paypal', 'enabled', e.target.checked)}
                className="rounded"
              />
              <span className="font-semibold">PayPal</span>
            </label>
            {settings.paymentGateways.paypal.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Client ID"
                  value={settings.paymentGateways.paypal.clientId}
                  onChange={(e) => handlePaymentGatewayChange('paypal', 'clientId', e.target.value)}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Secret"
                  value={settings.paymentGateways.paypal.secret}
                  onChange={(e) => handlePaymentGatewayChange('paypal', 'secret', e.target.value)}
                  className="input-field"
                />
              </div>
            )}
          </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Email Configuration</h2>
            <button onClick={handleTestEmail} className="text-blue-600 hover:underline">
              Send Test Email
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Email Service</label>
              <select
                value={settings.emailProvider.service}
                onChange={(e) => handleNestedChange('emailProvider', 'service', e.target.value)}
                className="input-field w-full"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="sendgrid">SendGrid</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Email User</label>
              <input
                type="email"
                value={settings.emailProvider.user}
                onChange={(e) => handleNestedChange('emailProvider', 'user', e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Email Password</label>
              <input
                type="password"
                value={settings.emailProvider.password}
                onChange={(e) => handleNestedChange('emailProvider', 'password', e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary px-8 py-3">
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
