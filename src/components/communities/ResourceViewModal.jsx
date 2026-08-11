import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, ExternalLink, Download, CheckCircle2, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'

const ResourceViewModal = ({ isOpen, onClose, resource, communityName }) => {
  if (!isOpen || !resource) return null

  const handleDownload = () => {
    toast.success(`📥 Downloaded "${resource.title}" guide!`)
  }

  const handleSave = () => {
    toast.success(`🔖 Saved "${resource.title}" to your bookmarks!`)
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
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {resource.type}
                </span>
                <h3 className="font-bold text-foreground text-lg mt-0.5">{resource.title}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/40">
              {resource.description}
            </p>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Resource Highlights & Topics:</h4>
              <p className="text-xs text-muted-foreground leading-relaxed bg-background p-3.5 rounded-xl border border-border/50">
                {resource.details}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Verified & curated for {communityName} students</span>
            </div>

            <div className="pt-4 border-t border-border/40 flex flex-wrap gap-2 justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5 text-primary" /> Bookmark
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={() => {
                  toast.success(`Opening ${resource.title}...`)
                  onClose()
                }}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Access Material
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ResourceViewModal
