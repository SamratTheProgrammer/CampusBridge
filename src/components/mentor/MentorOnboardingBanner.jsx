import React from 'react'
import { AlertCircle, CheckCircle2, Lock, ArrowRight, ShieldCheck, Sparkles, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MentorOnboardingBanner = ({ completeness, verificationStatus, onGoToSettings }) => {
  const navigate = useNavigate()
  const { percentage, missingFields } = completeness || { percentage: 0, missingFields: [] }

  const isApproved = verificationStatus === 'Approved'
  const isPending = percentage >= 80 && !isApproved
  const isIncomplete = percentage < 80

  if (percentage >= 100 || (isApproved && percentage >= 80)) return null;

  const handleAction = () => {
    if (onGoToSettings) {
      onGoToSettings()
    } else {
      navigate('/mentor-dashboard/settings')
    }
  }

  return (
    <div className={`border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 mb-6 relative overflow-hidden transition-all ${
      isApproved 
        ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-emerald-500/30' 
        : isPending 
          ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/5 border-blue-500/30'
          : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 border-amber-500/30'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
            isApproved 
              ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
              : isPending 
                ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' 
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            {isApproved ? (
              <ShieldCheck className="w-6 h-6" />
            ) : isPending ? (
              <Clock className="w-6 h-6 animate-pulse" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-foreground text-base sm:text-lg tracking-tight">
                {isApproved 
                  ? 'Verified Mentor & Account Fully Unlocked 🎉' 
                  : isPending 
                    ? 'Profile Completed! Awaiting Admin Verification ⏳' 
                    : 'Complete Your Mentor Profile (Req: 80%) 🔒'}
              </h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                isApproved 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : isPending 
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}>
                {isApproved ? 'Approved & Verified' : isPending ? 'Pending Admin Review' : `${percentage}% Completed`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {isApproved 
                ? 'Congratulations! Your profile has been verified by Admin. All mentor features (Mentees, Requests, Messages, Jobs, Analytics) are fully unlocked.'
                : isPending 
                  ? 'Your profile is 100% complete and submitted for review! Once Admin approves your verification application, all features will unlock automatically.'
                  : 'Please complete at least 80% of your mentor profile details to submit for Admin verification and unlock dashboard features.'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleAction}
          className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all text-xs flex items-center gap-2 shadow-md shadow-primary/10 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {isApproved ? 'Manage Settings' : isPending ? 'View Profile Settings' : 'Complete Settings'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-muted-foreground">Profile Completeness</span>
          <span className={percentage >= 80 ? 'text-emerald-500' : 'text-amber-600 dark:text-amber-400'}>{percentage}% / 100%</span>
        </div>
        <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-border/40">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${Math.max(5, percentage)}%` }}
          />
        </div>
      </div>

      {/* Missing Items List if under 80% */}
      {missingFields && missingFields.length > 0 && percentage < 80 && (
        <div className="pt-2 border-t border-amber-500/20 text-xs">
          <span className="font-bold text-foreground block mb-1.5">Remaining items to reach 80%:</span>
          <div className="flex flex-wrap gap-2">
            {missingFields.map((field, idx) => (
              <span key={idx} className="bg-background/80 border border-border/50 px-2.5 py-1 rounded-lg text-muted-foreground text-[11px] font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" /> {field}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MentorOnboardingBanner
