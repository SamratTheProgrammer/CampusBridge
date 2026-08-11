import React, { useState, useEffect } from 'react'
import { X, Image as ImageIcon, Video, UserPlus, MapPin, Smile, MoreHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'

const CreatePostModal = ({ isOpen, onClose, initialMedia }) => {
  const [content, setContent] = useState('')
  const [media, setMedia] = useState(null)

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
            <div className="relative mt-2 rounded-xl overflow-hidden bg-muted border border-border/50 group">
              <button 
                onClick={() => setMedia(null)}
                className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background rounded-full text-foreground transition-all z-10 opacity-0 group-hover:opacity-100 shadow-sm"
                title="Remove media"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">{media.name}</span>
              </div>
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
              <button className="hidden sm:block p-2 hover:bg-muted rounded-full transition-colors text-yellow-500" title="Add emoji" onClick={() => toast.success('Emoji picker opened!')}>
                <Smile className="w-5 h-5" />
              </button>
              <button className="sm:hidden p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground" onClick={() => toast.success('More options opened!')}>
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={!content.trim() && !media}
              className="bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-full font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePostModal
