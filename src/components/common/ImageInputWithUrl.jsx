import React, { useState, useEffect, useRef } from 'react'
import { Upload, Link as LinkIcon, Image as ImageIcon, X, AlertCircle } from 'lucide-react'

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
  const fileInputRef = useRef(null)

  // Sync external value / initialUrl changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (!file) {
        setUrl(value)
        setPreview(value)
      }
    } else if (initialUrl && !preview && !file) {
      setUrl(initialUrl)
      setPreview(initialUrl)
    }
  }, [value, initialUrl])

  // Handle local file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setHasError(false)
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
      if (onChangeFile) onChangeFile(selectedFile)
    }
  }

  // Handle URL input change
  const handleUrlChange = (e) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setHasError(false)
    if (!file) {
      setPreview(newUrl)
    }
    if (onChangeUrl) onChangeUrl(newUrl)
  }

  // Clear / remove current image
  const handleRemove = () => {
    setFile(null)
    setUrl('')
    setPreview('')
    setHasError(false)
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

      {/* Broken Image Warning if URL failed */}
      {hasError && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Unable to load image from the provided URL. Please check the link.</span>
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
