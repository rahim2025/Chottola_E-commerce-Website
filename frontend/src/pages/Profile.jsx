import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

const Profile = () => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: 'Dhaka',
    zipCode: '',
    country: 'Bangladesh'
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getMe();
      if (response.success) {
        const userData = response.data;
        setUserProfile(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });

        const defaultAddress = userData.addresses?.find((addr) => addr.isDefault) || userData.addresses?.[0];
        if (defaultAddress) {
          setAddressData({
            street: defaultAddress.street || defaultAddress.address || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || defaultAddress.division || 'Dhaka',
            zipCode: defaultAddress.zipCode || defaultAddress.postalCode || '',
            country: defaultAddress.country || 'Bangladesh'
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAddressChange = (e) => {
    setAddressData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const response = await userService.updateProfile(formData);
      if (response.success) {
        setUserProfile({ ...userProfile, ...response.data });
        updateUser(response.data);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const trimmedName = (formData.name || '').trim();
      const [firstName = 'Customer', ...rest] = trimmedName.split(/\s+/).filter(Boolean);
      const lastName = rest.join(' ') || 'Customer';

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        addresses: [
          {
            type: 'home',
            firstName,
            lastName,
            street: addressData.street,
            apartment: '',
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country || 'Bangladesh',
            phone: formData.phone || '',
            isDefault: true
          }
        ]
      };

      const response = await userService.updateProfile(payload);
      if (response.success) {
        setUserProfile((prev) => ({ ...prev, ...response.data }));
        toast.success('Address saved successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p>Unable to load your profile information. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="btn-primary"
              disabled={updating}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full btn-primary disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-gray-900 font-medium">{userProfile.name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{userProfile.email || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-gray-900 font-medium">{userProfile.phone || 'Not specified'}</p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 mt-6 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Default Address</h2>
            <form onSubmit={handleSaveAddress} className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Street Address</label>
                <textarea
                  name="street"
                  value={addressData.street}
                  onChange={handleAddressChange}
                  className="input-field"
                  rows={2}
                  placeholder="Enter your complete street address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={addressData.city}
                    onChange={handleAddressChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Division</label>
                  <input
                    type="text"
                    name="state"
                    value={addressData.state}
                    onChange={handleAddressChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={addressData.zipCode}
                    onChange={handleAddressChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={updating}
                className="w-full btn-primary disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Default Address'}
              </button>
            </form>

            <h2 className="text-lg font-semibold text-gray-900 mb-3">Password</h2>
            <p className="text-gray-600 text-sm mb-4">
              Forgot your password? Reset it with email OTP.
            </p>
            <Link to="/forgot-password" className="btn-secondary inline-block">
              Forgot / Reset Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
