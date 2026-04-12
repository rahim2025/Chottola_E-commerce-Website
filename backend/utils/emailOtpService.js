/**
 * Email OTP Service (DB-backed)
 * Generates and verifies OTP codes sent via email.
 */

const crypto = require('crypto');
const OTP = require('../models/OTP');
const { sendEmailOTP } = require('./emailService');

class EmailOTPService {
  constructor() {
    this.otpExpiry = parseInt(process.env.EMAIL_OTP_EXPIRY_MINUTES || process.env.OTP_EXPIRY_MINUTES || 5);
    this.maxAttempts = parseInt(process.env.EMAIL_OTP_MAX_ATTEMPTS || process.env.OTP_MAX_ATTEMPTS || 3);
    this.otpLength = 6;
  }

  normalizeEmail(email) {
    if (!email || typeof email !== 'string') return null;
    return email.trim().toLowerCase();
  }

  generateOTPCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  hashCode(code) {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'otp-secret';
    return crypto.createHash('sha256').update(`${code}:${secret}`).digest('hex');
  }

  async generateAndSendOTP(email, options = {}) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      return { success: false, message: 'Invalid email address' };
    }

    const now = new Date();
    const nowMs = now.getTime();

    let record = await OTP.findOne({ channel: 'email', identifier: normalizedEmail });

    if (record && record.expiresAt && record.expiresAt.getTime() < nowMs) {
      await OTP.deleteOne({ _id: record._id });
      record = null;
    }

    // Cooldown (1 minute)
    if (record?.cooldownUntil && record.cooldownUntil.getTime() > nowMs) {
      const remainingMs = record.cooldownUntil.getTime() - nowMs;
      return {
        success: false,
        message: 'Please wait before requesting a new OTP',
        retryAfter: Math.ceil(remainingMs / 1000)
      };
    }

    // Hourly limit (3 per hour)
    const windowStart = record?.hourlyWindowStart ? record.hourlyWindowStart.getTime() : 0;
    const oneHourMs = 60 * 60 * 1000;
    const isSameWindow = windowStart > 0 && nowMs - windowStart < oneHourMs;
    const hourlySendCount = isSameWindow ? record.hourlySendCount || 0 : 0;
    const effectiveWindowStart = isSameWindow ? record.hourlyWindowStart : now;

    if (hourlySendCount >= 3) {
      const resetInMs = effectiveWindowStart.getTime() + oneHourMs - nowMs;
      return {
        success: false,
        message: `Too many OTP requests. Please try again after ${Math.ceil(resetInMs / 60000)} minutes.`,
        retryAfter: Math.ceil(resetInMs / 1000)
      };
    }

    const code = this.generateOTPCode();
    const expiresAt = new Date(nowMs + this.otpExpiry * 60 * 1000);
    const cooldownUntil = new Date(nowMs + 60 * 1000);

    try {
      await sendEmailOTP({
        to: normalizedEmail,
        code,
        expiresInMinutes: this.otpExpiry,
        purpose: options.purpose || 'verification'
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      };
    }

    const update = {
      codeHash: this.hashCode(code),
      attempts: 0,
      maxAttempts: this.maxAttempts,
      expiresAt,
      verifiedAt: undefined,
      usedAt: undefined,
      cooldownUntil,
      hourlyWindowStart: effectiveWindowStart,
      hourlySendCount: hourlySendCount + 1,
      lastSentAt: now
    };

    await OTP.findOneAndUpdate(
      { channel: 'email', identifier: normalizedEmail },
      {
        $set: update,
        $setOnInsert: {
          channel: 'email',
          identifier: normalizedEmail
        }
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: this.otpExpiry * 60
    };
  }

  async verifyOTP(email, code) {
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail || !code) {
      return { success: false, message: 'Email and OTP code are required' };
    }

    const record = await OTP.findOne({ channel: 'email', identifier: normalizedEmail });

    if (!record) {
      return {
        success: false,
        message: 'No OTP found for this email. Please request a new one.'
      };
    }

    const now = Date.now();

    if (record.expiresAt.getTime() < now) {
      await OTP.deleteOne({ _id: record._id });
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    const maxAttempts = record.maxAttempts || this.maxAttempts;
    if ((record.attempts || 0) >= maxAttempts) {
      await OTP.deleteOne({ _id: record._id });
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }

    const otpCode = code.toString().trim();
    const incomingHash = this.hashCode(otpCode);

    if (record.codeHash !== incomingHash) {
      record.attempts = (record.attempts || 0) + 1;
      const remaining = maxAttempts - record.attempts;

      if (record.attempts >= maxAttempts) {
        await OTP.deleteOne({ _id: record._id });
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        };
      }

      await record.save();

      return {
        success: false,
        message: `Invalid OTP code. ${remaining} attempts remaining.`,
        attemptsRemaining: remaining
      };
    }

    record.verifiedAt = new Date();
    await record.save();

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  }

  async clearOTP(email) {
    const normalizedEmail = this.normalizeEmail(email) || email;
    await OTP.deleteOne({ channel: 'email', identifier: normalizedEmail });
  }

  async hasValidOTP(email) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) return false;

    const record = await OTP.findOne({ channel: 'email', identifier: normalizedEmail });
    if (!record) return false;
    if (!record.verifiedAt) return false;
    if (record.usedAt) return false;
    if (record.expiresAt.getTime() < Date.now()) return false;
    return true;
  }

  async consumeOTP(email) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) return;

    await OTP.updateOne(
      { channel: 'email', identifier: normalizedEmail },
      { $set: { usedAt: new Date() } }
    );
  }

  async getStats() {
    const totalOTPs = await OTP.countDocuments({ channel: 'email' });
    return {
      totalOTPs,
      otpExpiry: this.otpExpiry,
      maxAttempts: this.maxAttempts,
      mode: 'email',
      storage: 'mongodb'
    };
  }
}

module.exports = new EmailOTPService();
