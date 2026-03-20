import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../utils';

interface OtpInputProps {
  length?: number;
  initialValue?: string;
  onChange?: (otp: string) => void;
  onComplete?: (otp: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  initialValue = '',
  onChange,
  onComplete,
  error,
  disabled = false,
}) => {
  const [otp, setOtp] = useState<string[]>(
    initialValue.split('').concat(Array(length).fill('')).slice(0, length)
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    if (value !== '' && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange?.(otpString);

    // Auto-advance to next input when a digit is entered
    if (value && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }

    // Check if OTP is complete
    const otpComplete = newOtp.every(digit => digit !== '') && newOtp.length === length;
    if (otpComplete) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        // Clear current field
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      } else if (index > 0) {
        // Move to previous field and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Check if pasted data is a valid OTP (digits only)
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    if (digits.length > 0) {
      const newOtp = digits.split('').concat(Array(length).fill('')).slice(0, length);
      setOtp(newOtp);
      onChange?.(newOtp.join(''));

      // Focus the next empty field or last field
      const nextEmptyIndex = newOtp.findIndex(d => d === '');
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 10);

      // Check if complete
      if (newOtp.every(d => d !== '')) {
        onComplete?.(newOtp.join(''));
      }
    }
  }, [length, onChange, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              if (el) {
                inputRefs.current[index] = el;
              }
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'w-12 h-12 text-center text-lg font-semibold',
              'border-2 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-gold-500',
              error ? 'border-red-500' : 'border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={`OTP digit ${index + 1}`}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
};

OtpInput.displayName = 'OtpInput';
