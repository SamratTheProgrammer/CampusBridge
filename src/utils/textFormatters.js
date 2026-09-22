/**
 * Text and role formatting utilities for CampusBridge
 */

export const capitalizeFirst = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatRoleSubtitle = (headline, role, institution) => {
  let text = headline || institution || (role ? `${capitalizeFirst(role)} at CampusBridge` : 'CampusBridge Member');
  if (!text || typeof text !== 'string') return '';

  // Replace starting lowercase student/mentor variations
  text = text.replace(/^student(\b|\s+at)/i, (match) => 'Student' + match.slice(7));
  text = text.replace(/^mentor(\b|\s+at)/i, (match) => 'Mentor' + match.slice(6));

  if (/^mentor$/i.test(text.trim())) return 'Mentor';
  if (/^student$/i.test(text.trim())) return 'Student';

  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatMentorSubtitle = (headline, role) => {
  if (headline && typeof headline === 'string' && headline.trim()) {
    let text = headline.trim();
    text = text.replace(/^student(\b|\s+at)/i, (match) => 'Student' + match.slice(7));
    text = text.replace(/^mentor(\b|\s+at)/i, (match) => 'Mentor' + match.slice(6));
    if (/^mentor$/i.test(text)) return 'Mentor';
    if (/^student$/i.test(text)) return 'Student';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  if (role && typeof role === 'string' && role.trim()) {
    return capitalizeFirst(role.trim());
  }
  return 'Mentor';
};
