import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, ShieldCheck, Mail, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

const UserProfileModal = ({ isOpen, onClose, member, communityName }) => {
  if (!isOpen || !member) return null

  const handleConnect = () => {
    toast.success(`📩 Sent connection request to ${member.name}!`)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-1.5">
                  {member.name}
                  {member.role === 'Mentor' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </h3>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  member.role === 'Mentor' 
                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                    : member.role === 'Alumni' 
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                  {member.role}
                </span>
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
            <div className="bg-muted/30 p-4 rounded-xl border border-border/40 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Professional Headline</span>
              <p className="text-sm font-semibold text-foreground">{member.title}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40 text-muted-foreground">
                <span>Community</span>
                <span className="font-bold text-foreground">{communityName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40 text-muted-foreground">
                <span>Member Status</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Active Member
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 flex justify-end gap-2">
              <button
                onClick={() => {
                  toast.success(`Message box opened for ${member.name}`)
                  onClose()
                }}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
              <button
                onClick={handleConnect}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" /> Connect
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default UserProfileModal
