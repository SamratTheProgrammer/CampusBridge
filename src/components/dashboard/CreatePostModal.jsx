import React, { useState, useEffect, useRef } from 'react'
import { X, Image as ImageIcon, Video, UserPlus, MapPin, Smile, MoreHorizontal, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
import { useTheme } from '../ThemeProvider'

const CreatePostModal = ({ isOpen, onClose, initialMedia }) => {
  const [content, setContent] = useState('')
  const [media, setMedia] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [mediaUrlInput, setMediaUrlInput] = useState('')
  const emojiRef = useRef(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (initialMedia) {
      setMedia(initialMedia)
    }
  }, [initialMedia])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim() && !media) {
      toast.error('Post cannot be empty.')
      return
    }
    // Mock API call
    toast.success('Post published successfully!')
    handleClose()
  }

  const handleClose = () => {
    setContent('')
    setMedia(null)
    onClose()
  }

  const handleMediaChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMedia(e.target.files[0])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border/50 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h2 className="text-xl font-bold text-foreground">Create a post</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          <div className="flex gap-3">
            <img 
              src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" 
              alt="Profile" 
              className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-border/50"
            />
            <div>
              <h3 className="font-bold text-foreground text-sm">Barsha Mahajan</h3>
              <select className="text-xs bg-muted/50 border border-border/50 rounded px-2 py-1 mt-1 text-foreground focus:outline-none hover:bg-muted transition-colors cursor-pointer font-medium">
                <option>Anyone</option>
                <option>Connections only</option>
              </select>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="w-full h-32 bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-foreground text-lg placeholder:text-muted-foreground/60"
          />

          {media && (
            <div className="relative mt-2 rounded-xl overflow-hidden bg-muted border border-border/50 group flex items-center justify-center min-h-[120px] max-h-[260px] p-2">
              <button 
                onClick={() => setMedia(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-all z-10 shadow-sm cursor-pointer"
                title="Remove media"
              >
                <X className="w-4 h-4" />
              </button>
              {media.url ? (
                <img src={media.url} alt="Attached" className="max-h-[240px] w-auto max-w-full object-contain rounded-lg" />
              ) : media instanceof File && media.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(media)} alt="Attached" className="max-h-[240px] w-auto max-w-full object-contain rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">{media.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <button className="text-primary font-semibold text-sm hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
              Add hashtag
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="p-2 hover:bg-muted rounded-full transition-colors text-blue-500 cursor-pointer" title="Add a photo">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleMediaChange} 
                />
                <ImageIcon className="w-5 h-5" />
              </label>
              <button 
                type="button" 
                onClick={() => setShowUrlInput(!showUrlInput)} 
                className={`p-2 hover:bg-muted rounded-full transition-colors ${showUrlInput ? 'bg-primary/10 text-primary' : 'text-purple-500'}`} 
                title="Add image from URL"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
              <label className="p-2 hover:bg-muted rounded-full transition-colors text-green-500 cursor-pointer" title="Add a video">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={handleMediaChange} 
                />
                <Video className="w-5 h-5" />
              </label>
              <button className="p-2 hover:bg-muted rounded-full transition-colors text-orange-500" title="Tag connections" onClick={() => toast.success('Tag connections opened!')}>
                <UserPlus className="w-5 h-5" />
              </button>
              <button className="hidden sm:block p-2 hover:bg-muted rounded-full transition-colors text-red-500" title="Add location" onClick={() => toast.success('Add location opened!')}>
                <MapPin className="w-5 h-5" />
              </button>
              <div className="relative" ref={emojiRef}>
                <button 
                  type="button"
                  className="p-2 hover:bg-muted rounded-full transition-colors text-yellow-500" 
                  title="Add emoji" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden max-w-[calc(100vw-32px)]">
                    <EmojiPicker 
                      theme={isDark ? 'dark' : 'light'}
                      previewConfig={{ showPreview: false }}
                      width={320}
                      height={380}
                      lazyLoadEmojis={true}
                      searchPlaceHolder="Search emoji..."
                      onEmojiClick={(emojiData) => {
                        setContent(prev => prev + emojiData.emoji)
                        setShowEmojiPicker(false)
                      }}
                    />
                  </div>
                )}
              </div>
              <button className="sm:hidden p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground" onClick={() => toast.success('More options opened!')}>
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={!content.trim() && !media}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-1.5 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Post
            </button>
          </div>

          {/* URL Input Bar */}
          {showUrlInput && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-muted/40 rounded-xl border border-border/50 animate-in fade-in duration-200">
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="url"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                placeholder="Paste image URL (https://...)"
                className="flex-1 bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (mediaUrlInput.trim()) {
                      setMedia({ url: mediaUrlInput.trim(), name: 'Linked Image' });
                      setShowUrlInput(false);
                      setMediaUrlInput('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (mediaUrlInput.trim()) {
                    setMedia({ url: mediaUrlInput.trim(), name: 'Linked Image' });
                    setShowUrlInput(false);
                    setMediaUrlInput('');
                  }
                }}
                className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all cursor-pointer"
              >
                Attach
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreatePostModal
