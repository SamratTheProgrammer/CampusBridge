import React, { useState, useEffect, useRef } from 'react'
import { Upload, Link as LinkIcon, Image as ImageIcon, X, AlertCircle, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Smart URL sanitizer for common image links
 */
export const sanitizeImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  let url = rawUrl.trim()

  // Google Images redirect URL extraction
  if (url.includes('google.') && url.includes('imgurl=')) {
    try {
      const match = url.match(/[?&]imgurl=([^&]+)/)
      if (match && match[1]) {
        url = decodeURIComponent(match[1])
      }
    } catch (e) {}
  }

  // Google Drive share link -> direct thumbnail/image link
  const gDriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/)
  if (gDriveMatch) {
    const fileId = gDriveMatch[1] || gDriveMatch[2]
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
  }

  // Dropbox link -> raw direct download
  if (url.includes('dropbox.com')) {
    url = url.replace('?dl=0', '?raw=1')
    if (!url.includes('raw=1')) {
      url += (url.includes('?') ? '&' : '?') + 'raw=1'
    }
    return url
  }

  return url
}

/**
 * Checks if a URL looks like an HTML webpage rather than a direct image
 */
const isLikelyWebpageUrl = (url) => {
  if (!url) return false
  const lower = url.toLowerCase().split('?')[0].split('#')[0]
  return (
    lower.endsWith('.php') ||
    lower.endsWith('.html') ||
    lower.endsWith('.htm') ||
    lower.endsWith('.aspx') ||
    lower.endsWith('.jsp')
  )
}

/**
 * ImageInputWithUrl
 * 
 * Reusable component providing:
 * 1. File upload option
 * 2. Direct Image URL paste option side-by-side
 * 3. Live image preview with aspect-ratio adaptive container and clear/remove action
 * 4. Hidden/named inputs so forms using new FormData(e.target) work seamlessly
 */
const ImageInputWithUrl = ({
  label = 'Event Image / Banner (Optional)',
  initialUrl = '',
  value = '',
  onChangeUrl,
  onChangeFile,
  onClear,
  fileInputName = 'imageFile',
  urlInputName = 'imageUrl',
  className = '',
  showLabel = true,
  placeholder = 'https://images.unsplash.com/...'
}) => {
  const [url, setUrl] = useState(value || initialUrl || '')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(value || initialUrl || '')
  const [hasError, setHasError] = useState(false)
  const [webpageWarning, setWebpageWarning] = useState(false)
  const fileInputRef = useRef(null)

  // Sync external value / initialUrl changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (!file) {
        setUrl(value)
        const cleaned = sanitizeImageUrl(value)
        setPreview(cleaned)
        setWebpageWarning(isLikelyWebpageUrl(value))
      }
    } else if (initialUrl && !preview && !file) {
      setUrl(initialUrl)
      const cleaned = sanitizeImageUrl(initialUrl)
      setPreview(cleaned)
      setWebpageWarning(isLikelyWebpageUrl(initialUrl))
    }
  }, [value, initialUrl])

  // Handle local file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setHasError(false)
      setWebpageWarning(false)
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
      if (onChangeFile) onChangeFile(selectedFile)
      toast.success('Banner image selected!')
    }
  }

  // Handle URL input change
  const handleUrlChange = (e) => {
    const rawVal = e.target.value
    const cleaned = sanitizeImageUrl(rawVal)
    setUrl(rawVal)
    setHasError(false)
    const isWebpage = isLikelyWebpageUrl(rawVal)
    setWebpageWarning(isWebpage)

    if (!file) {
      setPreview(cleaned)
    }
    if (onChangeUrl) onChangeUrl(cleaned)
  }

  // Clear / remove current image
  const handleRemove = () => {
    setFile(null)
    setUrl('')
    setPreview('')
    setHasError(false)
    setWebpageWarning(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onChangeFile) onChangeFile(null)
    if (onChangeUrl) onChangeUrl('')
    if (onClear) onClear()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Live Preview Container if an image is selected or URL is provided */}
      {preview && !hasError && (
        <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-muted/30 p-2 flex items-center justify-center min-h-[120px] max-h-[220px] group transition-all">
          <div 
            className="absolute inset-0 bg-cover bg-center blur-xl opacity-20 scale-125 pointer-events-none"
            style={{ backgroundImage: `url(${preview})` }}
          />
          <img 
            src={preview} 
            alt="Preview" 
            referrerPolicy="no-referrer"
            onError={() => {
              // If it's a broken URL, notify user gracefully
              if (!file) setHasError(true)
            }}
            className="relative z-10 max-h-[180px] w-auto max-w-full object-contain rounded-xl shadow-xs transition-transform"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2.5 right-2.5 z-20 p-1.5 bg-black/75 hover:bg-rose-600 text-white rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1 text-xs font-medium"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      )}

      {/* Webpage Warning if user pasted an HTML/PHP page instead of direct image */}
      {webpageWarning && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Webpage URL detected. To use an image from this page, right-click the photo on that page and select &quot;Copy image address&quot;.</span>
        </div>
      )}

      {/* Broken Image Warning if URL failed */}
      {hasError && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Image failed to load. Please verify the URL points directly to an image (.jpg, .png, .webp).</span>
          </div>
          <button 
            type="button" 
            onClick={handleRemove} 
            className="underline font-semibold ml-2 hover:text-destructive/80 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Dual Options Grid: Upload File (Left) vs Paste URL (Right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Option 1: File Upload */}
        <label className="flex items-center justify-center gap-2 p-2.5 sm:p-3 border-2 border-dashed border-border/70 hover:border-primary/60 rounded-xl bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer select-none">
          <Upload className="w-4 h-4 text-primary shrink-0" />
          <div className="text-left overflow-hidden">
            <span className="block text-xs font-semibold truncate text-foreground">
              {file ? file.name : 'Upload File'}
            </span>
            <span className="block text-[10px] text-muted-foreground leading-tight">
              PNG, JPG, WEBP, GIF
            </span>
          </div>
          <input
            ref={fileInputRef}
            name={fileInputName}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Option 2: Image URL input */}
        <div className="flex flex-col justify-center">
          <div className="relative flex items-center">
            <LinkIcon className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              name={urlInputName}
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-border/60 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 ml-1">
            Or paste direct image URL
          </span>
        </div>
      </div>
    </div>
  )
}

export default ImageInputWithUrl
