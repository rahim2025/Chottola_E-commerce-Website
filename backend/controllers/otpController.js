const otpService = require('../utils/otpService');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
exports.sendOTP = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    // Generate and send OTP
    const result = await otpService.generateAndSendOTP(phone);

    if (!result.success) {
      return res.status(result.retryAfter ? 429 : 400).json({
        success: false,
        message: result.message,
        retryAfter: result.retryAfter
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone, otp } = req.body;

    // Verify OTP
    const result = await otpService.verifyOTP(phone, otp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        attemptsRemaining: result.attemptsRemaining
      });
    }

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend OTP (with cooldown)
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
exports.resendOTP = async (req, res, next) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    // Clear existing OTP and generate new one
    await otpService.clearOTP(phone);
    const result = await otpService.generateAndSendOTP(phone);

    if (!result.success) {
      return res.status(result.retryAfter ? 429 : 400).json({
        success: false,
        message: result.message,
        retryAfter: result.retryAfter
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get OTP service stats (for debugging)
 * @route   GET /api/auth/otp-stats
 * @access  Private/Admin
 */
exports.getOTPStats = async (req, res, next) => {
  try {
    const stats = await otpService.getStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
