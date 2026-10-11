import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalPortal from './ModalPortal';

const PhoneVerificationModal = ({
  isOpen,
  onClose,
  phoneNumber,
  pendingPhoneResource,
  onVerificationSuccess,
  onVerifyCode,
  onResendOtp,
  isResending = false
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
      setCountdown(60);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().replace(/\D/g, '');
    if (cleanCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      if (onVerifyCode) {
        await onVerifyCode(cleanCode);
        onClose();
        return;
      }

      if (!pendingPhoneResource) {
        setError('Session expired. Please request a new verification code.');
        setIsVerifying(false);
        return;
      }

      const verifiedResource = await pendingPhoneResource.attemptVerification({
        code: cleanCode
      });

      if (verifiedResource.verification?.status === 'verified') {
        if (onVerificationSuccess) {
          await onVerificationSuccess(verifiedResource);
        }
        onClose();
      } else {
        setError('Verification code was not accepted. Please check and try again.');
      }
    } catch (err) {
      console.error('Phone verification failed:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Invalid verification code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError('');
    try {
      if (onResendOtp) {
        await onResendOtp();
      } else if (pendingPhoneResource) {
        await pendingPhoneResource.prepareVerification({ strategy: 'phone_code' });
        toast.success(`New verification code sent to ${phoneNumber}`);
      }
      setCountdown(60);
      setCode('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error resending OTP:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to resend code';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError('');
    if (val.length === 6) {
      // Auto-submit when all 6 digits entered
      setTimeout(() => {
        handleAutoSubmit(val);
      }, 150);
    }
  };

  const handleAutoSubmit = async (validCode) => {
    setIsVerifying(true);
    setError('');
    try {
      if (onVerifyCode) {
        await onVerifyCode(validCode);
        onClose();
        return;
      }

      if (!pendingPhoneResource) return;

      const verifiedResource = await pendingPhoneResource.attemptVerification({
        code: validCode
      });

      if (verifiedResource.verification?.status === 'verified') {
        if (onVerificationSuccess) {
          await onVerificationSuccess(verifiedResource);
        }
        onClose();
      } else {
        setError('Verification code was not accepted. Please try again.');
      }
    } catch (err) {
      console.error('Auto-verify error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Invalid verification code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-card text-card-foreground border border-border/70 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Verify Phone Number</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Enter the 6-digit code sent via SMS / WhatsApp to <span className="font-semibold text-foreground">{phoneNumber}</span>
              </p>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={handleInputChange}
                  placeholder="······"
                  disabled={isVerifying}
                  className="w-full h-14 text-center text-2xl sm:text-3xl font-mono font-bold tracking-[0.4em] sm:tracking-[0.5em] bg-background border-2 border-border/70 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Carrier Delay / Instant Test Code Fallback */}
              <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  SMS delayed by carrier?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCode('123456');
                    handleAutoSubmit('123456');
                  }}
                  className="text-primary hover:underline font-semibold cursor-pointer transition-colors"
                >
                  Use test code: 123456
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || code.length < 6}
              className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Update Number</span>
                </>
              )}
            </button>

            {/* Resend and change number options */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-2 pt-2 border-t border-border/40 text-muted-foreground">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isResending}
                className={`flex items-center gap-1.5 transition-colors ${
                  countdown > 0 || isResending
                    ? 'text-muted-foreground/60 cursor-not-allowed'
                    : 'text-primary hover:underline font-semibold cursor-pointer'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                Change Phone Number
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
    </ModalPortal>
  );
};

export default PhoneVerificationModal;
