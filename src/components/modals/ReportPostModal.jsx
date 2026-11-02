import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, AlertTriangle, ShieldAlert, Loader2, CheckCircle2, MessageSquare, AlertOctagon, HelpCircle } from 'lucide-react';
import ModalPortal from './ModalPortal';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';

const REPORT_REASONS = [
  { id: 'Spam or Scam', label: 'Spam, promotional, or scam', icon: AlertOctagon, desc: 'Repetitive messages, fake promotions, or phishing links.' },
  { id: 'Harassment or Bullying', label: 'Harassment or bullying', icon: ShieldAlert, desc: 'Targeting individuals with hostile, threatening, or harmful content.' },
  { id: 'Hate Speech', label: 'Hate speech or abusive language', icon: AlertTriangle, desc: 'Attacking protected groups, slurs, or derogatory remarks.' },
  { id: 'Inappropriate Content', label: 'Graphic or inappropriate content', icon: Flag, desc: 'Nudity, sexual content, excessive violence, or dangerous behavior.' },
  { id: 'False Information', label: 'False or misleading information', icon: MessageSquare, desc: 'Misleading academic or campus claims, fabricated news.' },
  { id: 'Other', label: 'Other violation', icon: HelpCircle, desc: 'Violates general campus community guidelines or etiquette.' }
];

const ReportPostModal = ({ isOpen, onClose, post, currentUser, onReportSubmitted }) => {
  const [selectedReason, setSelectedReason] = useState('Spam or Scam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      toast.error('Please select a reason for reporting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterClerkId: currentUser?.id,
          reason: selectedReason,
          details: details.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Thank you for reporting. Our moderation team has been notified.', { duration: 4000 });
        if (onReportSubmitted) {
          onReportSubmitted(post._id);
        }
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Report submission error:', err);
      toast.error('Could not connect to server to report post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-card border border-border/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-border/40 flex items-start justify-between gap-3 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Flag className="w-5 h-5 fill-rose-500/20 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Report Post</h3>
                  <p className="text-xs text-muted-foreground">
                    Help keep CampusBridge safe. Why are you reporting this post?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select a Reason
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REPORT_REASONS.map((r) => {
                    const IconComponent = r.icon;
                    const isSelected = selectedReason === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReason(r.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-rose-500/10 border-rose-500/40 text-foreground shadow-xs'
                            : 'bg-muted/30 border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-md shrink-0 ${isSelected ? 'text-rose-500' : 'text-muted-foreground'}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isSelected ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-foreground'}`}>
                            {r.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {r.desc}
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                          isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-muted-foreground/40'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Additional Details <span className="font-normal text-muted-foreground/70 lowercase">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context or details for our moderation team..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Reports are completely anonymous. The post author will not know who reported it.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4 fill-white" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    </ModalPortal>
  );
};

export default ReportPostModal;

