// src/utils/dateFormatter.js

/**
 * Formats a date for general posts and content.
 * <= 15 days: relative time (e.g. 1m, 2h, 5d)
 * > 15 days current year: half date (e.g. 12 Aug)
 * > 15 days previous year: full date (e.g. 12 Aug 2023)
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);

  // If <= 14 days, show relative time
  if (diffInDays <= 14) {
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${diffInDays}d`;
  }

  // > 15 days
  const isSameYear = date.getFullYear() === now.getFullYear();
  const options = { day: 'numeric', month: 'short' };
  if (!isSameYear) {
    options.year = 'numeric';
  }
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Formats time for pending requests (e.g. 2 days ago, 5 hours ago)
 */
export const formatPendingRequestTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);

  if (diffInDays <= 14) {
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  }

  // > 14 days
  const isSameYear = date.getFullYear() === now.getFullYear();
  const options = { day: 'numeric', month: 'short' };
  if (!isSameYear) {
    options.year = 'numeric';
  }
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Formats time for accepted connections (e.g. Friends for 5 days)
 */
export const formatConnectionTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);

  if (diffInDays === 0) return 'Connected today';
  if (diffInDays === 1) return 'Friends for 1 day';
  return `Friends for ${diffInDays} days`;
};
