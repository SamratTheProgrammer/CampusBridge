import React, { useState, useEffect } from 'react';
import { Cake, Sparkles, Heart, Check, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';
import ringtoneService from '../../utils/ringtone';

/**
 * Checks if a dateOfBirth string matches today's month and day
 */
export const checkIsBirthdayToday = (dobString) => {
  if (!dobString) return false;
  try {
    const today = new Date();
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
      const parts = dobString.split(/[-/]/);
      if (parts.length >= 3) {
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return today.getMonth() === month && today.getDate() === day;
      }
      return false;
    }
    return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
  } catch (e) {
    return false;
  }
};

/**
 * BirthdayBanner Component
 * Shows celebratory banner on birthday with instant birthday wish capability.
 */
const BirthdayBanner = ({ user, currentUser, isOwnProfile = false }) => {
  const [hasWished, setHasWished] = useState(false);
  const [isWishing, setIsWishing] = useState(false);

  const dob = user?.dateOfBirth;
  const isBday = checkIsBirthdayToday(dob);

  // If private and not own profile, don't show
  if (!isBday) return null;
  if (!isOwnProfile && user?.dobVisibility === 'private') return null;

  const handleSendWish = async () => {
    if (hasWished || isWishing || !currentUser?.id) return;
    setIsWishing(true);

    try {
      const targetIdentifier = user?.username || user?.clerkId || user?._id;
      const res = await fetch(`${API_BASE}/api/users/${targetIdentifier}/wish-birthday`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderClerkId: currentUser.id,
        }),
      });

      if (res.ok) {
        setHasWished(true);
        try {
          ringtoneService.playNotificationSound(true);
        } catch (e) {}
        toast.success(`Birthday wish sent to ${user?.firstName}! 🎂🎈`, {
          icon: '🎉',
        });
      } else {
        toast.error('Could not send birthday wish');
      }
    } catch (err) {
      console.error('Error wishing birthday:', err);
      toast.error('Failed to send wish');
    } finally {
      setIsWishing(false);
    }
  };

  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border-2 border-amber-400/40 p-4 sm:p-5 shadow-lg shadow-amber-500/5 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-pink-500/20 text-2xl animate-bounce">
            🎂
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <span>
                {isOwnProfile
                  ? `Happy Birthday, ${user?.firstName || 'Friend'}! 🎉`
                  : `Today is ${user?.firstName}'s Birthday! 🎉`}
              </span>
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              {isOwnProfile
                ? 'CampusBridge wishes you a fantastic year ahead filled with joy, knowledge, and extraordinary achievements! 🎈✨'
                : `Celebrate and send your warmest birthday wishes to ${user?.firstName || 'them'} today! 🎈`}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {!isOwnProfile && (
          <button
            type="button"
            onClick={handleSendWish}
            disabled={hasWished || isWishing}
            className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              hasWished
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white shadow-pink-500/25 active:scale-95'
            }`}
          >
            {hasWished ? (
              <>
                <Check className="w-4 h-4" />
                <span>Wished! 🎉</span>
              </>
            ) : (
              <>
                <PartyPopper className="w-4 h-4" />
                <span>{isWishing ? 'Sending Wish...' : 'Wish Happy Birthday! 🎈'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BirthdayBanner;
