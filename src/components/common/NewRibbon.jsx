import React from 'react';

/**
 * Checks if a given post creation date is within the last 3 days (72 hours).
 * Supports Date instances, ISO date strings, timestamps, or MongoDB ObjectIds.
 * 
 * @param {string|Date|number} dateOrId 
 * @returns {boolean}
 */
export const isPostNew = (dateOrId) => {
  if (!dateOrId) return false;
  try {
    let createdTime;
    if (dateOrId instanceof Date) {
      createdTime = dateOrId.getTime();
    } else if (typeof dateOrId === 'number') {
      createdTime = dateOrId;
    } else if (typeof dateOrId === 'string') {
      const parsed = Date.parse(dateOrId);
      if (!isNaN(parsed)) {
        createdTime = parsed;
      } else if (dateOrId.length === 24 && /^[0-9a-fA-F]{24}$/.test(dateOrId)) {
        // Fallback: extract timestamp from MongoDB ObjectId (first 4 bytes = 8 hex chars)
        createdTime = parseInt(dateOrId.substring(0, 8), 16) * 1000;
      } else {
        return false;
      }
    } else {
      return false;
    }

    const now = Date.now();
    const diff = now - createdTime;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

    // Must be in the past or present, and within 3 days
    return diff >= 0 && diff <= THREE_DAYS_MS;
  } catch (err) {
    console.error('Error calculating isPostNew:', err);
    return false;
  }
};

/**
 * Red diagonal corner ribbon tag indicating a "New" post within the last 3 days.
 * Matched to the design of the user's reference image with rich red gradient,
 * white bold text, and corner shadow.
 */
const NewRibbon = ({ createdAt, date, id, className = '' }) => {
  const targetDate = createdAt || date || id;
  const isNew = isPostNew(targetDate);

  if (!isNew) return null;

  return (
    <div 
      className={`absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-30 select-none ${className}`}
      aria-label="New post"
    >
      <div 
        className="absolute top-4 -right-9 w-32 py-0.5 text-center text-white font-extrabold text-[11px] tracking-wider transform rotate-45 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 shadow-[0_3px_10px_rgba(220,38,38,0.5)] border-y border-white/25 uppercase"
      >
        <span className="drop-shadow-sm font-bold">New</span>
      </div>
    </div>
  );
};

export default NewRibbon;
