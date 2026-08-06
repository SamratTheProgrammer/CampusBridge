import React, { useState } from 'react'
import { X, FileText, CheckCircle2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

const JobApplicationModal = ({ isOpen, onClose, jobTitle, company }) => {
  const [step, setStep] = useState(1)
  const [resume, setResume] = useState(null)
  const [formData, setFormData] = useState({
    name: 'Samrat Saha',
    email: 'samrat@example.com',
    phone: '',
    coverLetter: ''
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setResume(e.target.files[0])
      toast.success('Resume attached')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!resume) {
      toast.error('Please attach your resume.')
      return
    }
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required.')
      return
    }
    // Mock submit
    toast.success('Application submitted successfully!')
    setStep(2)
  }

  const handleClose = () => {
    setStep(1)
    setResume(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border/50 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto hide-scrollbar relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur z-10 flex items-center justify-between p-4 sm:p-6 border-b border-border/40">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {step === 1 ? 'Apply for Role' : 'Application Sent'}
            </h2>
            {step === 1 && <p className="text-sm text-muted-foreground mt-1">{jobTitle} at {company}</p>}
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Full Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>Resume / CV *</span>
                  <span className="text-xs text-muted-foreground font-normal">PDF, DOC, DOCX</span>
                </label>
                {!resume ? (
                  <label className="border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer bg-muted/10">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                    <span className="text-sm font-medium text-foreground">Click to upload your resume</span>
                    <span className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB</span>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{resume.name}</p>
                        <p className="text-xs text-muted-foreground">{(resume.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setResume(null)}
                      className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex justify-between">
                  <span>Cover Letter</span>
                  <span className="text-xs text-muted-foreground font-normal">Optional</span>
                </label>
                <textarea 
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Why are you a great fit for this role?"
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all resize-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!resume || !formData.name || !formData.email}
                  className="bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Application Sent!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Your application for <span className="font-medium text-foreground">{jobTitle}</span> at <span className="font-medium text-foreground">{company}</span> has been submitted successfully.
                </p>
              </div>
              <div className="pt-8">
                <button 
                  onClick={handleClose}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobApplicationModal
