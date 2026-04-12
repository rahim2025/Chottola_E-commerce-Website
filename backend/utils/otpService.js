/**
 * OTP Service for Phone-based Authentication (DB-backed)
 * Stores OTPs in MongoDB for persistence across restarts.
 */

const crypto = require('crypto');
const OTP = require('../models/OTP');

class OTPService {
  constructor() {
    this.otpExpiry = parseInt(process.env.OTP_EXPIRY_MINUTES || 5);
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || 3);
    this.otpMode = process.env.OTP_MODE || 'console';
    this.otpLength = 6;
  }

  normalizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    return phone.trim();
  }

  generateOTPCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  hashCode(code) {
    const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'otp-secret';
    return crypto.createHash('sha256').update(`${code}:${secret}`).digest('hex');
  }

  sendOTP(phone, code, expiryMinutes) {
    if (this.otpMode === 'console') {
      const timestamp = new Date().toLocaleString();
      console.log('\n' + '='.repeat(60));
      console.log('📱 OTP VERIFICATION CODE');
      console.log('='.repeat(60));
      console.log(`Phone: ${phone}`);
      console.log(`OTP Code: ${code}`);
      console.log(`Expires in: ${expiryMinutes} minutes`);
      console.log(`Timestamp: ${timestamp}`);
      console.log('='.repeat(60) + '\n');
    } else if (this.otpMode === 'sms') {
      // TODO: Integrate with Twilio or other SMS service
      console.log(`[SMS] Sending OTP ${code} to ${phone}`);
    }
  }

  async generateAndSendOTP(phone) {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      return { success: false, message: 'Invalid phone number' };
    }

    const now = new Date();
    const nowMs = now.getTime();

    let record = await OTP.findOne({ channel: 'phone', identifier: normalizedPhone });

    // If TTL hasn't removed an expired record yet, clean it up logically.
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
      { channel: 'phone', identifier: normalizedPhone },
      {
        $set: update,
        $setOnInsert: {
          channel: 'phone',
          identifier: normalizedPhone
        }
      },
      { upsert: true, new: true }
    );

    this.sendOTP(normalizedPhone, code, this.otpExpiry);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: this.otpExpiry * 60
    };
  }

  async verifyOTP(phone, code) {
    const normalizedPhone = this.normalizePhone(phone);

    if (!normalizedPhone || !code) {
      return { success: false, message: 'Phone and OTP code are required' };
    }

    const record = await OTP.findOne({ channel: 'phone', identifier: normalizedPhone });

    if (!record) {
      return {
        success: false,
        message: 'No OTP found for this phone number. Please request a new one.'
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

  async clearOTP(phone) {
    const normalizedPhone = this.normalizePhone(phone) || phone;
    await OTP.deleteOne({ channel: 'phone', identifier: normalizedPhone });
  }

  async hasValidOTP(phone) {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) return false;

    const record = await OTP.findOne({ channel: 'phone', identifier: normalizedPhone });
    if (!record) return false;
    if (!record.verifiedAt) return false;
    if (record.usedAt) return false;
    if (record.expiresAt.getTime() < Date.now()) return false;
    return true;
  }

  async consumeOTP(phone) {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) return;

    await OTP.updateOne(
      { channel: 'phone', identifier: normalizedPhone },
      { $set: { usedAt: new Date() } }
    );
  }

  async getStats() {
    const totalOTPs = await OTP.countDocuments({ channel: 'phone' });
    return {
      totalOTPs,
      otpExpiry: this.otpExpiry,
      maxAttempts: this.maxAttempts,
      mode: this.otpMode,
      storage: 'mongodb'
    };
  }
}

module.exports = new OTPService();
