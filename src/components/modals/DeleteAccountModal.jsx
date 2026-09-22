import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import ModalPortal from './ModalPortal';

const CONFIRM_PHRASE = 'delete my account';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, userRole = 'account' }) => {
  const [inputText, setInputText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = inputText.trim().toLowerCase() === CONFIRM_PHRASE;

  const handleProceed = async () => {
    if (!isMatched || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-card border border-destructive/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-border/40 flex items-start justify-between gap-4 bg-destructive/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 border border-destructive/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Delete Account Permanently</h3>
                  <p className="text-xs text-destructive font-medium">Irreversible destructive action</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                disabled={isDeleting}
                className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Warning: This cannot be undone!</span>
                </div>
                <p className="text-foreground/80">
                  Deleting your {userRole} account will permanently erase your profile, personal details, connections, messages, posts, applications, and all associated account data. You will <strong className="text-destructive font-semibold">never be able to recover</strong> this data or re-access this account.
                </p>
              </div>

              {/* GitHub-style typing prompt */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-medium text-foreground">
                  To verify and confirm, please type <span className="font-mono font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded select-all">{CONFIRM_PHRASE}</span> below:
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  disabled={isDeleting}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-background border border-border/70 rounded-xl text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 focus:border-destructive transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isMatched) {
                      handleProceed();
                    }
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={!isMatched || isDeleting}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md ${
                  isMatched && !isDeleting
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer active:scale-95'
                    : 'bg-destructive/40 text-destructive-foreground/60 cursor-not-allowed'
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete My Account</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </ModalPortal>
  );
};

export default DeleteAccountModal;
