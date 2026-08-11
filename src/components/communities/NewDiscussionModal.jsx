import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const NewDiscussionModal = ({ isOpen, onClose, onAddDiscussion, communityName }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a discussion title')
      return
    }
    if (!content.trim()) {
      toast.error('Please enter discussion details')
      return
    }

    const newDisc = {
      id: `disc-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      author: authorName.trim() || 'Barsha Mahajan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      role: 'Student (CampusBridge Member)',
      time: 'Just now',
      replies: 0,
      views: 1
    }

    onAddDiscussion(newDisc)
    toast.success('🎉 Discussion posted successfully!')
    setTitle('')
    setContent('')
    setAuthorName('')
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card border border-border/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Start a Discussion</h3>
                <p className="text-xs text-muted-foreground">Posting in <span className="text-primary font-medium">{communityName}</span></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                Your Name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Barsha Mahajan"
                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                Discussion Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What topic or question would you like to discuss?"
                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                Description / Context <span className="text-destructive">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Provide details, code snippets, or context for your discussion point..."
                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                required
              />
            </div>

            <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Post Discussion
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default NewDiscussionModal
