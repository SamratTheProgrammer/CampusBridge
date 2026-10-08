import { Skeleton } from '../../components/ui/Skeleton'
import React, { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Bookmark, Share2, Loader2, MapPin, Briefcase, Calendar, Bell, BellRing, IndianRupee, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link as LinkIcon, FileText } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { getCompanyLogo, handleImageError } from '../../utils/logoHelper'
import API_BASE from '../../utils/api'
import { getAppUrl } from '../../utils/appUrl'
import { formatSalaryWithLPA, checkUserJobEligibility } from '../../utils/salaryHelper'
import ModalPortal from '../../components/modals/ModalPortal'
import ShareModal from '../../components/modals/ShareModal'

const JobDetails = () => {
  const { id } = useParams()
  const location = useLocation()
  const [job, setJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  const isMentor = location.pathname.startsWith('/mentor-dashboard') || user?.publicMetadata?.role === 'mentor'
  const backLink = isMentor ? '/mentor-dashboard/jobs' : '/dashboard/jobs'

  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isNotified, setIsNotified] = useState(false)
  const [isNotifying, setIsNotifying] = useState(false)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareConfig, setShareConfig] = useState(null)
  const [resumeLink, setResumeLink] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [profileResumeUrl, setProfileResumeUrl] = useState('')
  const [inputType, setInputType] = useState('upload') // 'profile', 'upload', 'link'
  const [updateProfileResumeToo, setUpdateProfileResumeToo] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchJobAndApplicationStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${id}`)
        if (!res.ok) throw new Error('Failed to fetch job')
        const data = await res.json()
        setJob(data)

        if (user) {
          setIsNotified(data.notifiedUsers?.some(u => u.clerkId === user.id) || false);
          const appRes = await fetch(`${API_BASE}/api/jobs/student/applications/${user.id}`)
          if (appRes.ok) {
            const apps = await appRes.json()
            const applied = apps.some(app => app.job?._id === data._id)
            setHasApplied(applied)
          }

          const savedRes = await fetch(`${API_BASE}/api/users/${user.id}/saved-jobs`)
          if (savedRes.ok) {
            const savedData = await savedRes.json()
            setIsSaved(savedData.some(savedJob => savedJob._id === data._id))
          }
        }
      } catch (err) {
        toast.error('Could not load job details')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) fetchJobAndApplicationStatus()
  }, [id, user])

  const [dbUser, setDbUser] = useState(null)
  useEffect(() => {
    if(user) {
      fetch(`${API_BASE}/api/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setDbUser(data)
        const savedResume = data?.resumeUrl || user?.unsafeMetadata?.resumeUrl || ''
        if (savedResume) {
          setProfileResumeUrl(savedResume)
          setInputType('profile')
        }
      })
      .catch(err => console.error(err))
    }
  }, [user])

  const checkEligibility = () => {
    return checkUserJobEligibility(job, dbUser || user).eligible;
  }

  const isEligible = checkEligibility()

  const handleApply = async (e) => {
    e.preventDefault()
    if (inputType === 'link' && !resumeLink) {
      toast.error('Please provide a resume link')
      return
    }
    if (inputType === 'upload' && !resumeFile) {
      toast.error('Please upload your resume file')
      return
    }
    if (inputType === 'profile' && !profileResumeUrl) {
      toast.error('No saved resume found in profile. Please upload a new file.')
      return
    }
    
    setIsSubmitting(true)
    let finalResumeLink = inputType === 'profile' ? profileResumeUrl : resumeLink;

    try {
      if (inputType === 'upload' && resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);
        const uploadRes = await fetch(`${API_BASE}/api/upload/resume`, {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload resume file');
        const uploadData = await uploadRes.json();
        finalResumeLink = uploadData.url;

        // Optionally sync to user profile if chosen
        if (updateProfileResumeToo) {
          try {
            await fetch(`${API_BASE}/api/users/${user.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resumeUrl: uploadData.url })
            });
            await user.update({
              unsafeMetadata: { ...user.unsafeMetadata, resumeUrl: uploadData.url }
            });
            setProfileResumeUrl(uploadData.url);
          } catch (profileErr) {
            console.warn('Could not update profile resume:', profileErr);
          }
        }
      }

      const res = await fetch(`${API_BASE}/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          resumeLink: finalResumeLink,
          coverLetter,
          clientHandledEmail: true
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to apply')
      }

      // EmailJS integration
      const applicantEmail = user.primaryEmailAddress?.emailAddress;
      const applicantName = user.fullName || user.firstName || 'Applicant';
      const recruiterName = (job.postedBy && (job.postedBy.firstName || job.postedBy.name))
        ? `${job.postedBy.firstName || ''} ${job.postedBy.lastName || ''}`.trim()
        : `${job.company} Recruitment Team`;

      const templateParams = {
        to_email: applicantEmail, // Send confirmation to the applicant
        user_email: applicantEmail,
        email: applicantEmail,
        recipient: applicantEmail,
        to_name: applicantName,
        user_name: applicantName,
        name: applicantName,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        from_name: 'CampusBridge',
        reply_to: job.postedBy?.email || 'support@campusbridge.com',
        recruiter_email: job.postedBy?.email || 'support@campusbridge.com',
        recruiter_name: recruiterName,
        recruiter: recruiterName,
        job_title: job.title,
        title: job.title,
        job_company: job.company,
        company: job.company,
        company_name: job.company,
        job_location: job.location,
        location: job.location,
        job_type: job.type,
        type: job.type,
        job_salary: job.salary || 'Not specified',
        salary: job.salary || 'Not specified',
        resume_link: finalResumeLink,
        cover_letter: coverLetter || 'No cover letter provided.',
        applied_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        message: `You have successfully applied for the ${job.title} role at ${job.company}.`
      };

      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_a3vg38b',
          import.meta.env.VITE_EMAILJS_JOB_TEMPLATE_ID || 'template_c45j16i',
          templateParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'JAA5yhiRssyoyqKqW'
        );
        toast.success('Application submitted and confirmation email sent!')
      } catch (emailErr) {
        console.error('Email failed to send:', emailErr);
        const errMsg = emailErr?.text || emailErr?.message || 'Check your EmailJS config/quota';
        toast.error(`Applied, but email notification failed: ${errMsg}`);
      }

      setHasApplied(true)
      setIsApplyModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = () => {
    setShareConfig({
      shareUrl: getAppUrl(`/dashboard/jobs/${id}`),
      shareType: 'job',
      itemId: id
    })
    setIsShareModalOpen(true)
  }

  const handleSave = async () => {
    if (!user) {
      toast.error('Please login to save jobs')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/save-job`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id })
      })
      if (!res.ok) throw new Error('Failed to save job')
      const data = await res.json()
      setIsSaved(data.isSaved)
      toast.success(data.isSaved ? 'Job saved!' : 'Job removed from saved list')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotify = async () => {
    if (!user) {
      toast.error('Please login to get notifications')
      return
    }
    setIsNotifying(true)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${id}/notify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id })
      })
      if (!res.ok) throw new Error('Failed to update notification preference')
      const data = await res.json()
      setIsNotified(data.isNotified)
      toast.success(data.message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsNotifying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-8 animate-pulse pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-5 w-24 rounded-md" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-5 mb-8">
            <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-md" />
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-border/40">
            <div className="space-y-3">
              <Skeleton className="h-3 w-32 rounded-md" />
              <div className="flex gap-3">
                <Skeleton className="h-6 w-40 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-11 w-full sm:w-32 rounded-xl" />
          </div>

          <div className="space-y-8">
            <section>
              <Skeleton className="h-6 w-40 rounded-md mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-4/6 rounded-md" />
              </div>
            </section>
            
            <section>
              <Skeleton className="h-6 w-40 rounded-md mb-4" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </section>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-8 text-center">
        <div className="bg-card border border-border/50 rounded-2xl p-12 shadow-sm">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-2">Job not found</h3>
          <p className="text-muted-foreground text-sm mb-6">The job you are looking for does not exist or has been removed.</p>
          <Link to={backLink} className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-lg font-medium text-sm transition-colors">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const jobLogo = getCompanyLogo(job.company, job.companyLogo)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-8">
      {/* Top Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to={backLink} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm border ${
              isSaved 
                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                : 'bg-card text-muted-foreground hover:text-foreground border-border/50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
          </button>
          
          {job.deadline && (
            <button 
              onClick={handleNotify}
              disabled={isNotifying}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm border ${
                isNotified 
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' 
                  : 'bg-card text-muted-foreground hover:text-foreground border-border/50'
              }`}
              title="Get notified 3 days before deadline"
            >
              {isNotified ? <BellRing className="w-4 h-4 fill-amber-600" /> : <Bell className="w-4 h-4" />} 
              {isNotified ? 'Notified' : 'Notify Me'}
            </button>
          )}

          <button onClick={handleShare} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border/50 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl border border-border/50 bg-white flex items-center justify-center p-3 shrink-0 overflow-hidden">
              <img 
                src={jobLogo} 
                alt={job.company} 
                className="max-w-full max-h-full object-contain"
                onError={(e) => handleImageError(e, job.company)}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{job.title}</h1>
              <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
              <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                <span>{job.type}</span> 
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span> 
                <span>{job.location}</span>
                {job.salary && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                    <span className="text-primary font-bold">{formatSalaryWithLPA(job.salary)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-border/40">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Posted on {format(new Date(job.createdAt), 'd MMM yyyy')}
            </p>
            {job.deadline && (() => {
              const d = new Date(job.deadline);
              d.setHours(23, 59, 59, 999);
              const isDeadlinePassed = new Date() > d;
              return (
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-foreground">
                  <span className="text-xs">Last Date: {format(new Date(job.deadline), 'd MMM yyyy')}</span>
                  
                  {isDeadlinePassed ? (
                    <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Date Over (Expired)
                    </span>
                  ) : (
                    <a 
                      href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent('Apply for ' + job.title)}&dates=${format(new Date(job.deadline), 'yyyyMMdd')}/${format(new Date(job.deadline), 'yyyyMMdd')}&details=${encodeURIComponent(`Last date to apply for ${job.title} at ${job.company}.\n\nApply here: ${window.location.href}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full text-[10px] sm:text-xs uppercase font-bold tracking-wider"
                      title="Add Deadline to Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Add to Calendar
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
          {isMentor ? (
            <button 
              onClick={handleShare}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share with Students
            </button>
          ) : (() => {
            const d = job.deadline ? new Date(job.deadline) : null;
            if (d) d.setHours(23, 59, 59, 999);
            const isDeadlinePassed = d ? new Date() > d : false;
            return (
              <button 
                disabled={hasApplied || isDeadlinePassed || !isEligible}
                onClick={() => setIsApplyModalOpen(true)}
                className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-xl font-medium transition-colors shadow-sm ${
                  hasApplied 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : isDeadlinePassed
                    ? 'bg-destructive/10 text-destructive cursor-not-allowed border border-destructive/30'
                    : !isEligible 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border/50'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {hasApplied ? 'Applied' : isDeadlinePassed ? 'Date Over' : !isEligible ? 'Not Eligible' : 'Apply Now'}
              </button>
            )
          })()}
        </div>

        {(() => {
          const d = job.deadline ? new Date(job.deadline) : null;
          if (d) d.setHours(23, 59, 59, 999);
          const isDeadlinePassed = d ? new Date() > d : false;
          if (!isDeadlinePassed) return null;
          return (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Application Deadline Passed</p>
                <p className="text-xs opacity-90">The last date to apply for this job was {format(new Date(job.deadline), 'd MMMM yyyy')}. New applications are currently closed.</p>
              </div>
            </div>
          );
        })()}

        {/* Content */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Job Description</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {job.description || 'No description provided.'}
            </div>
          </section>

          {job.eligibility && (Object.keys(job.eligibility).length > 0) && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-3">Eligibility Criteria</h2>
              <div className="bg-muted/20 p-4 rounded-xl border border-border/30 space-y-3">
                {job.eligibility.tenthMarks && (
                  <div className="flex gap-2 text-sm text-foreground">
                    <span className="font-semibold text-muted-foreground w-28">10th Marks:</span>
                    <span>{job.eligibility.tenthMarks}</span>
                  </div>
                )}
                {job.eligibility.hsMarks && (
                  <div className="flex gap-2 text-sm text-foreground">
                    <span className="font-semibold text-muted-foreground w-28">12th Marks:</span>
                    <span>{job.eligibility.hsMarks}</span>
                  </div>
                )}
                {job.eligibility.graduationMarks && (
                  <div className="flex gap-2 text-sm text-foreground">
                    <span className="font-semibold text-muted-foreground w-28">Graduation:</span>
                    <span>{job.eligibility.graduationMarks}</span>
                  </div>
                )}
                {job.eligibility.pgMarks && (
                  <div className="flex gap-2 text-sm text-foreground">
                    <span className="font-semibold text-muted-foreground w-28">Post Grad:</span>
                    <span>{job.eligibility.pgMarks}</span>
                  </div>
                )}
                {job.eligibility.courses && job.eligibility.courses.length > 0 && (
                  <div className="flex gap-2 text-sm text-foreground">
                    <span className="font-semibold text-muted-foreground w-28">Valid Courses:</span>
                    <span className="flex flex-wrap gap-1.5">
                      {job.eligibility.courses.map((c, i) => (
                        <span key={i} className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-bold">{c}</span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {job.salary && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-3">Salary / Stipend</h2>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 bg-muted/30 px-3.5 py-2 rounded-lg w-fit border border-border/40">
                <IndianRupee className="w-4 h-4 text-primary" /> {formatSalaryWithLPA(job.salary)}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <ModalPortal>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Apply for {job.title}</h2>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                </div>
                <button onClick={() => setIsApplyModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">Resume (Required)</label>
                    <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50">
                      {profileResumeUrl && (
                        <button
                          type="button"
                          onClick={() => setInputType('profile')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${inputType === 'profile' ? 'bg-background shadow-sm text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Saved Resume
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setInputType('upload')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${inputType === 'upload' ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputType('link')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${inputType === 'link' ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Use Link
                      </button>
                    </div>
                  </div>

                  {inputType === 'profile' ? (
                    <div className="mt-1 p-4 border border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-foreground truncate">Saved Profile Resume</h4>
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                Ready
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              Using resume uploaded in your CampusBridge profile.
                            </p>
                          </div>
                        </div>
                        <a
                          href={profileResumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-primary hover:underline bg-background border border-border px-3 py-1.5 rounded-lg shrink-0 shadow-sm"
                        >
                          View PDF
                        </a>
                      </div>
                    </div>
                  ) : inputType === 'upload' ? (
                    <div>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border/50 border-dashed rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors relative cursor-pointer" onClick={() => document.getElementById('resume-upload').click()}>
                        <div className="space-y-1 text-center">
                          {resumeFile ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="text-sm text-foreground font-medium">{resumeFile.name}</div>
                              <div className="text-xs text-muted-foreground">Click to change file</div>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                              <div className="flex text-sm text-muted-foreground justify-center mt-2">
                                <span className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                                  <span>Upload a file</span>
                                </span>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 5MB</p>
                            </>
                          )}
                          <input
                            id="resume-upload"
                            name="resume-upload"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="sr-only"
                            onChange={(e) => { if(e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]) }}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer mt-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={updateProfileResumeToo}
                          onChange={(e) => setUpdateProfileResumeToo(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Also update my saved profile resume with this file</span>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        required={inputType === 'link'}
                        value={resumeLink}
                        onChange={(e) => setResumeLink(e.target.value)}
                        placeholder="e.g. Google Drive or Dropbox link"
                        className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">Make sure the link is publicly accessible.</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Cover Letter (Optional)</label>
                  <textarea
                    rows={5}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Why are you a good fit for this role?"
                    className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2.5 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        shareUrl={shareConfig?.shareUrl} 
        shareType={shareConfig?.shareType} 
        itemId={shareConfig?.itemId} 
      />
    </div>
  )
}

export default JobDetails
