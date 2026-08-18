import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, Share2, Loader2, MapPin, Briefcase, Calendar, Bell, BellRing, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link as LinkIcon, FileText } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { getCompanyLogo, handleImageError } from '../../utils/logoHelper'
import API_BASE from '../../utils/api'

const JobDetails = () => {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isNotified, setIsNotified] = useState(false)
  const [isNotifying, setIsNotifying] = useState(false)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [resumeLink, setResumeLink] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [inputType, setInputType] = useState('upload') // 'upload' or 'link'
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

  const handleApply = async (e) => {
    e.preventDefault()
    if (inputType === 'link' && !resumeLink) {
      toast.error('Please provide a resume link')
      return
    }
    if (inputType === 'upload' && !resumeFile) {
      toast.error('Please upload your resume')
      return
    }
    
    setIsSubmitting(true)
    let finalResumeLink = resumeLink;

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
      }

      const res = await fetch(`${API_BASE}/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          resumeLink: finalResumeLink,
          coverLetter
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to apply')
      }

      // EmailJS integration
      const templateParams = {
        to_email: user.primaryEmailAddress?.emailAddress, // Send confirmation to the applicant
        user_email: user.primaryEmailAddress?.emailAddress, // alias
        email: user.primaryEmailAddress?.emailAddress, // alias
        reply_to: job.postedBy?.email, // alias
        to_name: user.fullName || user.firstName || 'Applicant',
        from_name: 'CampusBridge',
        recruiter_email: job.postedBy?.email,
        recruiter_name: job.postedBy ? `${job.postedBy.firstName} ${job.postedBy.lastName || ''}`.trim() : 'Mentor',
        applicant_name: user.fullName || user.firstName,
        applicant_email: user.primaryEmailAddress?.emailAddress,
        job_title: job.title,
        job_company: job.company,
        job_location: job.location,
        job_type: job.type,
        job_salary: job.salary || 'Not specified',
        resume_link: finalResumeLink,
        cover_letter: coverLetter || 'No cover letter provided.',
        message: `You have successfully applied for the ${job.title} role at ${job.company}.`
      };

      try {
        await emailjs.send(
          'service_a3vg38b',
          'template_c45j16i',
          templateParams,
          'JAA5yhiRssyoyqKqW'
        );
        toast.success('Application submitted and email sent!')
      } catch (emailErr) {
        console.error('Email failed to send:', emailErr);
        const errMsg = emailErr?.text || emailErr?.message || 'Check your EmailJS config/quota';
        toast.error(`Applied, but email failed: ${errMsg}`);
      }

      setHasApplied(true)
      setIsApplyModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy link')
    }
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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-8 text-center">
        <div className="bg-card border border-border/50 rounded-2xl p-12 shadow-sm">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-2">Job not found</h3>
          <p className="text-muted-foreground text-sm mb-6">The job you are looking for does not exist or has been removed.</p>
          <Link to="/dashboard/jobs" className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-lg font-medium text-sm transition-colors">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const jobLogo = getCompanyLogo(job.company, job.companyLogo)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Top Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/dashboard/jobs" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
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
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>{job.type}</span> <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span> <span>{job.location}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-border/40">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Posted on {format(new Date(job.createdAt), 'd MMM yyyy')}
            </p>
            {job.deadline && (
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-foreground">
                <span className="text-xs">Last Date: {format(new Date(job.deadline), 'd MMM yyyy')}</span>
                
                <a 
                  href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent('Apply for ' + job.title)}&dates=${format(new Date(job.deadline), 'yyyyMMdd')}/${format(new Date(job.deadline), 'yyyyMMdd')}&details=${encodeURIComponent(`Last date to apply for ${job.title} at ${job.company}.\n\nApply here: ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full text-[10px] sm:text-xs uppercase font-bold tracking-wider"
                  title="Add Deadline to Google Calendar"
                >
                  <Calendar className="w-3.5 h-3.5" /> Add to Calendar
                </a>
              </div>
            )}
          </div>
          {(() => {
            const isDeadlinePassed = job.deadline ? new Date() > new Date(job.deadline) : false;
            return (
              <button 
                disabled={hasApplied || isDeadlinePassed}
                onClick={() => setIsApplyModalOpen(true)}
                className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-xl font-medium transition-colors shadow-sm ${
                  hasApplied 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : isDeadlinePassed
                    ? 'bg-destructive/10 text-destructive cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {hasApplied ? 'Applied' : isDeadlinePassed ? 'Date Over' : 'Apply Now'}
              </button>
            )
          })()}
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Job Description</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {job.description || 'No description provided.'}
            </div>
          </section>

          {job.salary && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-3">Salary / Stipend</h2>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-3 py-2 rounded-lg w-fit border border-border/40">
                <IndianRupee className="w-4 h-4 text-primary" /> {job.salary}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                    <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/50">
                      <button
                        type="button"
                        onClick={() => setInputType('upload')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${inputType === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputType('link')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${inputType === 'link' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Use Link
                      </button>
                    </div>
                  </div>

                  {inputType === 'upload' ? (
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
        )}
      </AnimatePresence>
    </div>
  )
}

export default JobDetails
