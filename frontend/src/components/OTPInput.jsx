import React, { useRef, useEffect } from 'react';

/**
 * OTP Input Component
 * Displays 6 input boxes for OTP entry
 * Features:
 * - Auto-focus next input on digit entry
 * - Paste support for full OTP
 * - Backspace navigation
 * - Clean, accessible design
 */
const OTPInput = ({ 
  value = '', 
  onChange = () => {}, 
  onComplete = () => {}, 
  length = 6,
  disabled = false,
  error = null 
}) => {
  const inputRefs = useRef([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index, digit) => {
    // Only allow digits
    if (!/^\d*$/.test(digit)) return;

    // Update value
    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('').slice(0, length);
    
    onChange(updatedValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all digits entered
    if (updatedValue.length === length) {
      onComplete(updatedValue);
    }
  };

  const handleKeyDown = (index, e) => {
    const { key } = e;

    if (key === 'Backspace') {
      e.preventDefault();
      
      const newValue = value.split('');
      if (newValue[index]) {
        // Clear current input
        newValue[index] = '';
      } else if (index > 0) {
        // Move to previous input
        newValue[index - 1] = '';
        inputRefs.current[index - 1]?.focus();
      }
      
      onChange(newValue.join(''));
    } else if (key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, length);

    if (digits.length > 0) {
      onChange(digits);
      
      // Focus the appropriate next input
      const nextIndex = Math.min(digits.length, length - 1);
      if (digits.length === length) {
        onComplete(digits);
      } else {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div className="otp-input-container">
      <div className="otp-inputs">
        {[...Array(length)].map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            maxLength="1"
            inputMode="numeric"
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`otp-input ${error ? 'error' : ''} ${value[index] ? 'filled' : ''}`}
            aria-label={`OTP digit ${index + 1}`}
            pattern="[0-9]"
          />
        ))}
      </div>
      
      {error && (
        <div className="otp-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <style>{`
        .otp-input-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .otp-inputs {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .otp-input {
          width: 50px;
          height: 50px;
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
          background-color: #fff;
          color: #1f2937;
          caret-color: transparent;
        }

        .otp-input:hover:not(:disabled) {
          border-color: #d1d5db;
        }

        .otp-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .otp-input.filled {
          border-color: #10b981;
          color: #059669;
        }

        .otp-input:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .otp-input.error {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .otp-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .otp-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #991b1b;
          font-size: 14px;
          animation: slideIn 0.3s ease;
        }

        .error-icon {
          font-size: 18px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .otp-input {
            width: 45px;
            height: 45px;
            font-size: 18px;
          }

          .otp-inputs {
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default OTPInput;
