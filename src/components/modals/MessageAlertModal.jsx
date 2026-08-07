import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, UserPlus } from 'lucide-react'

const MessageAlertModal = ({ isOpen, onClose, onConnect }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 100 }}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 101 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-xl p-6 pointer-events-auto text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                  <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 p-1 bg-card rounded-full hover:bg-muted text-muted-foreground transition-colors border border-border/50 shadow-sm md:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Connection Required
              </h3>
              <p className="text-muted-foreground mb-6">
                You need to be connected with this mentor before you can send them a direct message. Would you like to connect now?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border/50 hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onConnect();
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Connect Now
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MessageAlertModal
