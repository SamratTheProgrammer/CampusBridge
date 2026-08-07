import React, { useState, useRef, useEffect } from 'react'
import { User, Briefcase, GraduationCap, Code, FileText, CheckCircle2, Save, Upload, Sparkles, Loader2, Lock, Shield, Globe } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState('basic')
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [headline, setHeadline] = useState('')
  const [location, setLocation] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const fileInputRef = useRef(null)
  const resumeInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setHeadline(user.unsafeMetadata?.headline || '')
      setLocation(user.unsafeMetadata?.location || '')
      setAboutMe(user.unsafeMetadata?.aboutMe || '')
      setResumeUrl(user.unsafeMetadata?.resumeUrl || '')
    }
  }, [user])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await user.setProfileImage({ file })
      toast.success('Profile picture updated!')
    } catch (err) {
      toast.error('Failed to update profile picture')
      console.error(err)
    }
  }

  const handleSaveChanges = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await user.update({
        firstName,
        lastName,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          headline,
          location,
          aboutMe,
          resumeUrl
        }
      })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to save changes')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadResume = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      
      if (data.success) {
        setResumeUrl(data.url)
        // Also save immediately to clerk so it's not lost if they forget to hit save
        await user.update({
          unsafeMetadata: {
             ...user.unsafeMetadata,
             resumeUrl: data.url
          }
        })
        toast.success('Resume uploaded successfully!')
      } else {
        toast.error('Failed to upload resume')
      }
    } catch (err) {
      console.error('Resume upload error:', err)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      await user.updatePassword({ currentPassword, newPassword })
      toast.success('Password updated securely!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      console.error(err)
      toast.error(err.errors?.[0]?.longMessage || 'Failed to update password')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'resume', label: 'Resume/Docs', icon: FileText },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  ]

  const calculateProgress = () => {
    const fields = [
      firstName,
      lastName,
      user?.imageUrl && !user.imageUrl.includes('default'), // check if not default placeholder if possible, or just user.imageUrl
      headline,
      location,
      aboutMe,
      resumeUrl
    ]
    const filledCount = fields.filter(f => typeof f === 'string' ? f.trim().length > 0 : Boolean(f)).length
    return Math.round((filledCount / fields.length) * 100)
  }

  const completionPercentage = calculateProgress()

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      
      {/* Header & Progress */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Profile Settings</h1>
        
        <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-foreground">Profile Completion</h3>
              <span className="text-primary font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Complete your profile to stand out to recruiters and mentor mentors.
            </p>
          </div>
          <button 
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shrink-0 flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            Save All Changes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Sidebar (Tabs) */}
        <div className="w-full md:w-64 bg-card border border-border/50 rounded-2xl p-4 shadow-sm shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap shrink-0
                ${activeTab === tab.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              <span>{tab.label}</span>
              {/* Green checkmark if completed (mock logic) */}
              {['basic', 'education', 'skills'].includes(tab.id) && (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto hidden md:block" />
              )}
            </button>
          ))}
        </div>

        {/* Right Content Area (Forms) */}
        <div className="flex-1 w-full bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm min-h-[500px]">
          
          {/* --- BASIC INFO --- */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Basic Information</h2>
              
              <div className="flex items-center gap-6 mb-6">
                <img 
                  src={user?.imageUrl || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border border-border/50"
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/50"
                >
                  Change Photo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Headline (Tagline)</label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="MCA Student | Seeking SDE Internships" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kolkata, India" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Contact Email</label>
                  <input type="email" disabled value={user?.primaryEmailAddress?.emailAddress || ''} className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none text-sm text-foreground transition-all cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email address cannot be changed directly.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">About Me</label>
                  <textarea rows="4" value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} placeholder="Passionate software developer..." className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"></textarea>
                </div>
              </div>
            </div>
          )}

          {/* --- EXPERIENCE --- */}
          {activeTab === 'experience' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Experience</h2>
                <button className="text-primary text-sm font-medium hover:underline">+ Add Experience</button>
              </div>
              <p className="text-sm text-muted-foreground italic text-center py-8">No experience added yet.</p>
            </div>
          )}

          {/* --- EDUCATION --- */}
          {activeTab === 'education' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Education</h2>
                <button className="text-primary text-sm font-medium hover:underline">+ Add Education</button>
              </div>
              <p className="text-sm text-muted-foreground italic text-center py-8">No education added yet.</p>
            </div>
          )}

          {/* --- SKILLS --- */}
          {activeTab === 'skills' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Skills</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Add a new skill</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. React, Python, Data Analysis" className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                    <button className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">Add</button>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Top Skills</h4>
                  <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                </div>
              </div>
            </div>
          )}

          {/* --- RESUME/DOCS --- */}
          {activeTab === 'resume' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Resume & Documents</h2>
              
              {/* AI Resume Enhancer Section */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-24 h-24 text-primary" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">AI Resume Generator</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                    Use our advanced AI to automatically generate a professional, ATS-friendly resume based on your profile details, experience, and skills above. Or let the AI enhance your current resume's bullet points!
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Generate New Resume
                    </button>
                    <button className="bg-background text-foreground border border-border/50 hover:bg-muted px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Enhance Existing
                    </button>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => resumeInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer mt-6 relative"
              >
                <input 
                  type="file" 
                  ref={resumeInputRef} 
                  onChange={handleUploadResume} 
                  accept=".pdf,.doc,.docx" 
                  className="hidden" 
                />
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <h3 className="font-bold text-foreground mb-1">Uploading Resume...</h3>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                    <h3 className="font-bold text-foreground mb-1">Upload a Custom Resume</h3>
                    <p className="text-sm text-muted-foreground mb-4">Click to browse files (PDF, DOC).</p>
                    <button className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-xl text-sm font-medium transition-colors">
                      Browse Files
                    </button>
                  </>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <h4 className="text-sm font-bold text-foreground">Your Documents</h4>
                {resumeUrl ? (
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/10 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500/10 text-red-500 p-2.5 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Uploaded Resume</p>
                        <p className="text-xs text-muted-foreground">Click view to open in new tab</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline px-2">View</a>
                      <button onClick={async () => {
                        setResumeUrl('')
                        await user.update({ unsafeMetadata: { ...user.unsafeMetadata, resumeUrl: '' }})
                        toast.success('Resume removed')
                      }} className="text-xs font-medium text-destructive hover:underline px-2">Remove</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No resume uploaded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* --- PRIVACY & SECURITY --- */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div className="w-full">
                    <h4 className="font-semibold text-sm text-foreground">Change Password</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Update your account password securely using Clerk.</p>
                    <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-sm">
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Current Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="New Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Globe className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Profile Visibility</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Control who can see your profile on the platform.</p>
                    <select className="bg-background border border-border/50 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs">
                      <option>Public (Everyone)</option>
                      <option>Recruiters & Mentors Only</option>
                      <option>Hidden</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Settings
