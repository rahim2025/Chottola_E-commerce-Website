const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailOtpService = require('../utils/emailOtpService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, otp } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    let emailLower = null;
    emailLower = email.toLowerCase();
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Email OTP is required for registration'
      });
    }

    const verifyResult = await emailOtpService.verifyOTP(emailLower, otp);
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining
      });
    }

    // Create user with enhanced security
    const userData = {
      name,
      password
    };
    if (emailLower) {
      userData.email = emailLower;
      userData.emailVerified = true;
    }
    const user = await User.create(userData);
    await emailOtpService.consumeOTP(emailLower);

    // Generate tokens
    const { accessToken, refreshToken } = generateToken(user._id);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const loginIdentifier = email.toLowerCase();

    // Check if user exists and select password field
    const user = await User.findOne({ email: loginIdentifier }).select('+password');
    
    if (!user) {
      console.log(`Login attempt failed: User not found for ${loginIdentifier}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      console.log(`Login attempt failed: Account inactive for ${loginIdentifier}`);
      return res.status(401).json({
        success: false,
        message: 'Account is suspended or deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      console.log(`Login attempt failed: Wrong password for ${loginIdentifier}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateToken(user._id, rememberMe);

    // Set refresh token as httpOnly cookie
    const refreshTokenAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenAge
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          loyaltyPoints: user.loyaltyPoints
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -security.loginAttempts -security.lockUntil')
      .populate('addresses')
      .populate('wishlist');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires refresh token)
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || user.accountStatus !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const { accessToken } = generateToken(user._id, false, true); // Only access token

      res.status(200).json({
        success: true,
        data: {
          accessToken
        }
      });
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    const otpResult = await emailOtpService.generateAndSendOTP(normalizedEmail, {
      purpose: 'password reset'
    });

    if (!otpResult.success) {
      return res.status(otpResult.retryAfter ? 429 : 400).json({
        success: false,
        message: otpResult.message,
        retryAfter: otpResult.retryAfter
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent successfully',
      expiresIn: otpResult.expiresIn
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, otp, password } = req.body;
    const normalizedEmail = email?.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    const verifyResult = await emailOtpService.verifyOTP(normalizedEmail, otp);
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining
      });
    }

    // Set new password
    user.password = password;
    user.passwordChangedAt = new Date();
    await user.save();
    await emailOtpService.consumeOTP(normalizedEmail);

    // Generate new tokens
    const { accessToken, refreshToken } = generateToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      'verification.email.token': hashedToken,
      'verification.email.expires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.verification.email.isVerified = true;
    user.verification.email.token = undefined;
    user.verification.email.expires = undefined;
    user.verification.email.verifiedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register user with phone + verified OTP
// @route   POST /api/auth/register/phone
// @access  Public
exports.registerWithPhone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone, otp, name } = req.body;
    const otpService = require('../utils/otpService');

    // Verify OTP first
    if (!(await otpService.hasValidOTP(phone))) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP first. Request a new OTP and verify it.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ phone }, { email: phone.toLowerCase() }]
    });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number'
      });
    }

    // Create user with phone auth
    const userData = {
      phone,
      name: name || null,
      authMethod: 'phone',
      phoneVerified: true
    };
    
    const user = await User.create(userData);

    // Consume OTP (mark as used)
    await otpService.consumeOTP(phone);

    // Generate tokens
    const { accessToken, refreshToken } = generateToken(user._id);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully with phone',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod,
          phoneVerified: user.phoneVerified
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with phone + OTP
// @route   POST /api/auth/login/phone
// @access  Public
exports.loginWithPhone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone, rememberMe } = req.body;
    const otpService = require('../utils/otpService');

    // Verify OTP first
    if (!(await otpService.hasValidOTP(phone))) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP first'
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is suspended or deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Consume OTP
    await otpService.consumeOTP(phone);

    // Generate tokens
    const { accessToken, refreshToken } = generateToken(user._id, rememberMe);

    // Set refresh token as httpOnly cookie
    const refreshTokenAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenAge
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod,
          phoneVerified: user.phoneVerified,
          loyaltyPoints: user.loyaltyPoints
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (add name/email for phone users)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update name if provided
    if (name && name.trim().length >= 2) {
      user.name = name.trim();
    }

    // Update email if provided
    if (email && email.includes('@')) {
      const emailLower = email.toLowerCase();
      
      // Check if email already exists
      const emailExists = await User.findOne({ 
        email: emailLower,
        _id: { $ne: user._id }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }

      user.email = emailLower;
      user.authMethod = user.authMethod === 'phone' ? 'both' : user.authMethod;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          authMethod: user.authMethod
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
