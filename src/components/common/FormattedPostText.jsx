import React from 'react'

/**
 * URL regex with case-insensitive flag (/i) to detect URLs in any case:
 * - HTTPS://GOOGLE.COM
 * - http://example.com
 * - WWW.CAMPUSBRIDGE.IN
 * - etc.
 */
const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

/**
 * Helper to split text and return JSX elements with purple, bold, no-underline links
 */
export const renderFormattedContent = (text, customLinkClass = '') => {
  if (!text || typeof text !== 'string') return text

  const parts = text.split(URL_REGEX)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    // Check if this part is a URL
    if (part.match(/^(https?:\/\/|www\.)/i)) {
      // Separate any trailing punctuation (. , ! ? ; : ) ] >)
      const match = part.match(/^([\s\S]*?)([.,!?:;)>\]]+)?$/)
      const cleanUrl = match ? match[1] : part
      const trailing = match && match[2] ? match[2] : ''

      let href = cleanUrl
      if (!href.toLowerCase().startsWith('http://') && !href.toLowerCase().startsWith('https://')) {
        href = `https://${href}`
      }

      return (
        <React.Fragment key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={
              customLinkClass ||
              "text-purple-600 dark:text-purple-400 font-bold no-underline hover:text-purple-500 hover:opacity-90 break-all transition-colors cursor-pointer"
            }
          >
            {cleanUrl}
          </a>
          {trailing}
        </React.Fragment>
      )
    }
    return part
  })
}

/**
 * FormattedPostText Component
 * Renders post text while styling detected links as purple, bold, and without underline.
 */
const FormattedPostText = ({ text, className = '', isGradient = false }) => {
  if (!text) return null

  const linkClass = isGradient
    ? "text-purple-200 font-bold no-underline hover:text-white break-all transition-colors cursor-pointer drop-shadow-sm"
    : "text-purple-600 dark:text-purple-400 font-bold no-underline hover:text-purple-500 hover:opacity-90 break-all transition-colors cursor-pointer"

  return (
    <span className={className}>
      {renderFormattedContent(text, linkClass)}
    </span>
  )
}

export default FormattedPostText
