const emailOtpService = require('../utils/emailOtpService');
const { validationResult } = require('express-validator');

/**
 * @desc    Send OTP to email address
 * @route   POST /api/auth/send-email-otp
 * @access  Public
 */
exports.sendEmailOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, purpose } = req.body;

    const result = await emailOtpService.generateAndSendOTP(email, { purpose });

    if (!result.success) {
      return res.status(result.retryAfter ? 429 : 400).json({
        success: false,
        message: result.message,
        retryAfter: result.retryAfter
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP code for email address
 * @route   POST /api/auth/verify-email-otp
 * @access  Public
 */
exports.verifyEmailOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    const result = await emailOtpService.verifyOTP(email, otp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        attemptsRemaining: result.attemptsRemaining
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend OTP to email address (clears old one)
 * @route   POST /api/auth/resend-email-otp
 * @access  Public
 */
exports.resendEmailOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, purpose } = req.body;

    await emailOtpService.clearOTP(email);
    const result = await emailOtpService.generateAndSendOTP(email, { purpose });

    if (!result.success) {
      return res.status(result.retryAfter ? 429 : 400).json({
        success: false,
        message: result.message,
        retryAfter: result.retryAfter
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get email OTP stats (debug)
 * @route   GET /api/auth/email-otp-stats
 * @access  Private/Admin (currently protected by /api/auth protect middleware if enabled)
 */
exports.getEmailOTPStats = async (req, res, next) => {
  try {
    const stats = await emailOtpService.getStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
