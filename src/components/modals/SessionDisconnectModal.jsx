import React, { useEffect } from 'react';
import { ShieldAlert, LogOut, KeyRound, MapPin, Clock, ArrowRight } from 'lucide-react';
import ringtoneService from '../../utils/ringtone';

const SessionDisconnectModal = ({ isOpen, disconnectDetails, onConfirmLogin, onResetPassword }) => {
  useEffect(() => {
    if (isOpen) {
      try {
        ringtoneService.playNotificationSound(true);
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const revokedBy = disconnectDetails?.revokedBy || {};
  const deviceName = revokedBy.deviceName || (revokedBy.browser && revokedBy.os ? `${revokedBy.browser} on ${revokedBy.os}` : 'Another Device');
  const location = [revokedBy.city, revokedBy.country].filter(Boolean).join(', ') || 'Unknown Location';
  const ip = revokedBy.ipAddress || '';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-card/95 border border-destructive/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-destructive/20 relative overflow-hidden text-center animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-destructive/20 rounded-full blur-3xl pointer-events-none" />

        {/* Pulsing Icon */}
        <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping opacity-75" />
          <div className="relative w-16 h-16 rounded-2xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center text-destructive shadow-lg shadow-destructive/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold tracking-wide uppercase mb-3">
          <LogOut className="w-3.5 h-3.5" /> Session Disconnected
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2 tracking-tight">
          Logged Out Remotely
        </h2>
        
        {/* Bengali & English explanatory text */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
          আপনার অ্যাকাউন্টটি অন্য ডিভাইস থেকে ডিসকানেক্ট করা হয়েছে।
          <span className="block mt-1 font-normal text-muted-foreground/90">
            Your session on this device was terminated remotely for your account security.
          </span>
        </p>

        {/* Details Card */}
        <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-semibold text-foreground/80">Terminated By:</span>
            <span className="font-bold text-foreground text-right truncate max-w-[200px]" title={deviceName}>
              {deviceName}
            </span>
          </div>

          {location && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> Location:
              </span>
              <span className="text-right truncate max-w-[200px]" title={location}>
                {location} {ip ? `(${ip})` : ''}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Time:
            </span>
            <span className="text-right">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Just now
            </span>
          </div>
        </div>

        {/* Security Alert Note */}
        <p className="text-[11px] text-muted-foreground/80 bg-background/50 border border-border/40 rounded-xl p-3 mb-6 text-left leading-relaxed">
          <span className="font-semibold text-foreground block mb-0.5">⚠️ Security Tip</span>
          If you didn't initiate this action, another person may have logged into your account. Please log in and change your password immediately.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onConfirmLogin}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Log In Again</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onResetPassword && (
            <button
              type="button"
              onClick={onResetPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold border border-border/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Reset Password for Safety</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDisconnectModal;
