import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import ModalPortal from './ModalPortal'
import defaultPP from '../../assets/default_pp.png'
import { handleImageError } from '../../utils/logoHelper'

const LikesModal = ({ isOpen, onClose, post, likes: directLikes, currentUserId, currentUserRole }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const likesList = directLikes || post?.likes || []

  const handleUserClick = (like) => {
    onClose()
    const targetId = like.username || like.clerkId
    if (!targetId || targetId === 'unknown') return

    if (like.clerkId === currentUserId) {
      const activeRole = currentUserRole || sessionStorage.getItem('campusbridge_user_role') || 'student'
      navigate(activeRole === 'mentor' ? '/mentor-dashboard/profile' : '/dashboard/profile')
    } else {
      navigate(`/profile/${targetId}`)
    }
  }

  return (
    <AnimatePresence>
      <ModalPortal>
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl w-full max-w-sm flex flex-col max-h-[80vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="bg-rose-500 text-white rounded-full p-1.5 shadow-sm">
                  <Heart className="w-4 h-4 fill-current" />
                </span>
                <h3 className="font-bold text-foreground">Likes</h3>
                {likesList.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {likesList.length}
                  </span>
                )}
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Likes List */}
            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1">
              {likesList.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No likes yet
                </div>
              ) : (
                likesList.map((like, i) => (
                  <div 
                    key={like.clerkId || i} 
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors group"
                  >
                    {/* DP / Avatar */}
                    <img 
                      src={like.image || defaultPP} 
                      onError={handleImageError}
                      alt={like.name || 'User'} 
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-border/50 cursor-pointer group-hover:scale-105 transition-transform" 
                      onClick={() => handleUserClick(like)}
                    />

                    {/* Name & Role / Headline */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleUserClick(like)}
                    >
                      <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {like.name || 'Anonymous User'}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {like.role || 'Member'}
                      </p>
                    </div>

                    {/* View Button */}
                    <button 
                      onClick={() => handleUserClick(like)}
                      className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-medium rounded-full transition-colors cursor-pointer shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </ModalPortal>
    </AnimatePresence>
  )
}

export default LikesModal
