/**
 * Escapes special regular expression characters in a string to safely use it in RegExp constructors.
 * Prevents ReDoS (Regular Expression Denial of Service) and RegExp syntax injection errors.
 * 
 * @param {string} str - The raw user input string
 * @returns {string} - The escaped string safe for new RegExp()
 */
export const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default escapeRegex;
