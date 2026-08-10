import React, { useState, useRef, useEffect } from 'react'
import { 
  Bell, Lock, User, Save, Globe, Shield, CreditCard, Loader2, AtSign, Check, 
  AlertCircle, Laptop, Smartphone, MapPin, Trash2, Plus, Briefcase, GraduationCap, 
  FileText, ExternalLink, Sparkles, X, UploadCloud, Award
} from 'lucide-react'
import { useUser, useSessionList, useSession } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import ImageCropModal from '../../components/ImageCropModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { useCurrentDevice } from '../../hooks/useCurrentDevice'

import { calculateProfileCompleteness } from '../../utils/profileCompleteness'

const MentorSettings = () => {
  const { user, isLoaded } = useUser()
  const { sessions } = useSessionList()
  const { session: currentSession } = useSession()
  const currentDeviceInfo = useCurrentDevice()
  const [activeTab, setActiveTab] = useState('profile')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [userDoc, setUserDoc] = useState(null)
  const [completeness, setCompleteness] = useState({ percentage: 0, missingFields: [] })
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [headline, setHeadline] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  
  // Work Experience, Education, Skills, Resume State
  const [experienceList, setExperienceList] = useState([])
  const [educationList, setEducationList] = useState([])
  const [skillsList, setSkillsList] = useState([])
  const [resumeUrl, setResumeUrl] = useState('')
  const [isUploadingResume, setIsUploadingResume] = useState(false)

  // Temp Inline Add Item Forms
  const [showAddExp, setShowAddExp] = useState(false)
  const [newExpTitle, setNewExpTitle] = useState('')
  const [newExpCompany, setNewExpCompany] = useState('')
  const [newExpDuration, setNewExpDuration] = useState('')
  const [newExpDesc, setNewExpDesc] = useState('')

  const [showAddEdu, setShowAddEdu] = useState(false)
  const [newEduDegree, setNewEduDegree] = useState('')
  const [newEduInst, setNewEduInst] = useState('')
  const [newEduDuration, setNewEduDuration] = useState('')
  const [newEduGrade, setNewEduGrade] = useState('')

  const [newSkillInput, setNewSkillInput] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [usernameValue, setUsernameValue] = useState('')
  const [usernameError, setUsernameError] = useState('')
  
  const fileInputRef = useRef(null)
  const resumeInputRef = useRef(null)
  
  // Image crop state
  const [cropModalData, setCropModalData] = useState(null)

  const fetchProfile = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserDoc(data);
        setUsernameValue(data.username || '');
        setFirstName(data.firstName || user.firstName || '');
        setLastName(data.lastName || user.lastName || '');
        setHeadline(data.headline || '');
        setAboutMe(data.aboutMe || '');
        setPhone(data.phone || user.unsafeMetadata?.phone || '');
        setAddress(data.address || user.unsafeMetadata?.address || '');
        setYearsOfExperience(data.yearsOfExperience || '');
        setExperienceList(Array.isArray(data.experience) ? data.experience : []);
        setEducationList(Array.isArray(data.education) ? data.education : []);
        setSkillsList(Array.isArray(data.skills) ? data.skills : []);
        setResumeUrl(data.resumeUrl || '');
        if (data.profileVisibility) setProfileVisibility(data.profileVisibility);
        
        const comp = calculateProfileCompleteness(data);
        setCompleteness(comp);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user])

  const handleProfilePicSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropModalData({ src: reader.result, type: 'dp' })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const uploadProfilePic = async (file) => {
    try {
      toast.loading('Updating profile picture...', { id: 'pic-upload' })
      await user.setProfileImage({ file })
      await user.reload()
      
      await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: user.imageUrl })
      })

      toast.success('Profile picture updated!', { id: 'pic-upload' })
    } catch (err) {
      toast.error('Failed to update profile picture', { id: 'pic-upload' })
      console.error(err)
    } finally {
      setCropModalData(null)
    }
  }

  const handleCropComplete = (croppedFile) => {
    if (cropModalData?.type === 'dp') {
      uploadProfilePic(croppedFile)
    }
  }

  // Resume Upload Handler
  const handleResumeSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingResume(true)
    toast.loading('Uploading resume document...', { id: 'resume-up' })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.success && data.url) {
        setResumeUrl(data.url)
        toast.success('Resume uploaded successfully!', { id: 'resume-up' })
      } else {
        toast.error(data.message || 'Failed to upload resume', { id: 'resume-up' })
      }
    } catch (err) {
      console.error('Error uploading resume:', err)
      toast.error('Failed to upload resume', { id: 'resume-up' })
    } finally {
      setIsUploadingResume(false)
      e.target.value = ''
    }
  }

  // Experience Handlers
  const handleAddExperienceItem = (e) => {
    e.preventDefault()
    if (!newExpTitle || !newExpCompany) {
      toast.error('Job Title and Company Name are required.')
      return
    }
    const item = {
      title: newExpTitle,
      company: newExpCompany,
      duration: newExpDuration || 'Present',
      description: newExpDesc
    }
    setExperienceList([...experienceList, item])
    setNewExpTitle('')
    setNewExpCompany('')
    setNewExpDuration('')
    setNewExpDesc('')
    setShowAddExp(false)
    toast.success('Work Experience added!')
  }

  const handleRemoveExperience = (index) => {
    setExperienceList(experienceList.filter((_, i) => i !== index))
    toast.success('Work Experience item removed.')
  }

  // Education Handlers
  const handleAddEducationItem = (e) => {
    e.preventDefault()
    if (!newEduDegree || !newEduInst) {
      toast.error('Degree/Field and Institution Name are required.')
      return
    }
    const item = {
      degree: newEduDegree,
      institution: newEduInst,
      duration: newEduDuration || 'Completed',
      grade: newEduGrade
    }
    setEducationList([...educationList, item])
    setNewEduDegree('')
    setNewEduInst('')
    setNewEduDuration('')
    setNewEduGrade('')
    setShowAddEdu(false)
    toast.success('Education credential added!')
  }

  const handleRemoveEducation = (index) => {
    setEducationList(educationList.filter((_, i) => i !== index))
    toast.success('Education item removed.')
  }

  // Skills Handlers
  const handleAddSkill = (e) => {
    e.preventDefault()
    if (!newSkillInput.trim()) return
    const cleanSkill = newSkillInput.trim()
    if (skillsList.includes(cleanSkill)) {
      toast.error('Skill already added.')
      return
    }
    setSkillsList([...skillsList, cleanSkill])
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove))
  }

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    try {
      toast.loading("Deleting account and all profile data...", { id: "delete-acc" });
      await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      await user.delete();
      toast.success("Account deleted successfully", { id: "delete-acc" });
    } catch(e) {
      console.error('Error deleting account:', e);
      toast.error("Failed to delete account", { id: "delete-acc" });
    } finally {
      setIsConfirmOpen(false);
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          headline,
          aboutMe,
          address,
          phone,
          yearsOfExperience,
          experience: experienceList,
          education: educationList,
          skills: skillsList,
          resumeUrl
        })
      });

      await user.update({
        firstName,
        lastName,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          headline,
          address,
          phone
        }
      })

      const checkRes = await fetch(`/api/users/${user.id}`);
      if (checkRes.ok) {
        const updatedData = await checkRes.json();
        setUserDoc(updatedData);
        const comp = calculateProfileCompleteness(updatedData);
        setCompleteness(comp);

        if (comp.percentage >= 80) {
          if (updatedData.verificationStatus !== 'Approved') {
            await fetch(`/api/users/${user.id}/profile`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ verificationStatus: 'Pending' })
            });
            toast.success(`🎉 Profile updated (${comp.percentage}% complete)! Verification application submitted to Admin.`);
          } else {
            toast.success(`Profile updated (${comp.percentage}% complete)!`);
          }
        } else {
          toast.success(`Profile updated (${comp.percentage}% complete). Reach 80% to unlock full features.`);
        }
      }
    } catch (err) {
      toast.error('Failed to save changes')
      console.error(err)
    } finally {
      setIsSaving(false)
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your mentor profile, credentials, experience, resume, and skills.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none bg-card border border-border/50 rounded-2xl p-2 sm:p-3 shadow-sm md:bg-transparent md:border-0 md:p-0 md:shadow-none">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'profile' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <User className="w-4 h-4 shrink-0" /> Account Profile
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'notifications' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Bell className="w-4 h-4 shrink-0" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'privacy' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Lock className="w-4 h-4 shrink-0" /> Privacy & Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border border-border/50 rounded-2xl p-4 sm:p-8 shadow-sm">
          
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Account Profile</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  completeness.percentage >= 80 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {completeness.percentage}% Complete (Min: 80%)
                </span>
              </div>

              {/* Progress gauge banner inside settings */}
              <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Profile Completeness Score</span>
                  <span className={completeness.percentage >= 80 ? 'text-emerald-500' : 'text-amber-500'}>{completeness.percentage}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${completeness.percentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>
                {completeness.missingFields && completeness.missingFields.length > 0 && (
                  <p className="text-[11px] text-muted-foreground pt-1">
                    <strong className="text-foreground">Missing items:</strong> {completeness.missingFields.join(', ')}
                  </p>
                )}
              </div>
              
              {/* Profile Photo */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-border/40 text-center sm:text-left">
                <img 
                  src={user?.imageUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
                <div className="space-y-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleProfilePicSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                    >
                      Upload New Photo (+15%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Settings Form */}
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    disabled 
                    value={user?.primaryEmailAddress?.emailAddress || ''} 
                    className="w-full px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-not-allowed" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Headline / Professional Title (+15%)</label>
                  <input 
                    type="text" 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Software Engineer at Amazon | Cloud Specialist" 
                    className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">About Me / Professional Bio (+15%)</label>
                  <textarea 
                    rows="3"
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    placeholder="Describe your background, expertise, and what you offer to students as a mentor..."
                    className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Address / Location</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Kolkata, West Bengal"
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Years of Experience (+15%)</label>
                    <input 
                      type="text" 
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      placeholder="e.g. 5+ years" 
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                </div>

                {/* 1. WORK EXPERIENCE SECTION (+20%) */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" /> Work Experience (+20%)
                      </h3>
                      <p className="text-xs text-muted-foreground">Add your past or current job roles to build credibility.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddExp(!showAddExp)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Experience
                    </button>
                  </div>

                  {/* Existing Experience Items List */}
                  <div className="space-y-2">
                    {experienceList.length > 0 ? (
                      experienceList.map((exp, idx) => (
                        <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                              {exp.title} <span className="text-xs font-medium text-primary">({exp.duration})</span>
                            </h4>
                            <p className="text-muted-foreground font-semibold">{exp.company}</p>
                            {exp.description && <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">{exp.description}</p>}
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                            title="Remove Experience"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground">
                        No work experience added yet. Click "+ Add Experience" above to add your work details.
                      </div>
                    )}
                  </div>

                  {/* Add Experience Form Box */}
                  {showAddExp && (
                    <div className="bg-muted/50 border border-primary/20 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">New Work Experience</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Job Title (e.g. Senior Software Engineer)" 
                          value={newExpTitle}
                          onChange={(e) => setNewExpTitle(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Company Name (e.g. Amazon / Google)" 
                          value={newExpCompany}
                          onChange={(e) => setNewExpCompany(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Duration (e.g. 2021 - Present / 2 yrs)" 
                          value={newExpDuration}
                          onChange={(e) => setNewExpDuration(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Short Role Description (optional)" 
                          value={newExpDesc}
                          onChange={(e) => setNewExpDesc(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => setShowAddExp(false)} 
                          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={handleAddExperienceItem} 
                          className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90"
                        >
                          Save Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. EDUCATION CREDENTIALS SECTION (+20%) */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" /> Education Credentials (+20%)
                      </h3>
                      <p className="text-xs text-muted-foreground">Add your university degrees or certifications.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddEdu(!showAddEdu)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Education
                    </button>
                  </div>

                  {/* Existing Education Items List */}
                  <div className="space-y-2">
                    {educationList.length > 0 ? (
                      educationList.map((edu, idx) => (
                        <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                              {edu.degree} <span className="text-xs font-medium text-primary">({edu.duration})</span>
                            </h4>
                            <p className="text-muted-foreground font-semibold">{edu.institution}</p>
                            {edu.grade && <p className="text-muted-foreground text-[11px]">Grade / Score: {edu.grade}</p>}
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveEducation(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                            title="Remove Education"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground">
                        No education records added yet. Click "+ Add Education" above to add details.
                      </div>
                    )}
                  </div>

                  {/* Add Education Form Box */}
                  {showAddEdu && (
                    <div className="bg-muted/50 border border-primary/20 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">New Education Credential</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Degree / Specialization (e.g. B.Tech CS)" 
                          value={newEduDegree}
                          onChange={(e) => setNewEduDegree(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Institution / University (e.g. NIT Trichy)" 
                          value={newEduInst}
                          onChange={(e) => setNewEduInst(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Graduation Year / Duration (e.g. 2018 - 2022)" 
                          value={newEduDuration}
                          onChange={(e) => setNewEduDuration(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Grade / CGPA (e.g. 8.8 CGPA)" 
                          value={newEduGrade}
                          onChange={(e) => setNewEduGrade(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => setShowAddEdu(false)} 
                          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={handleAddEducationItem} 
                          className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90"
                        >
                          Save Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. EXPERTISE & SKILLS SECTION (+15%) */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" /> Expertise & Skills (+15%)
                    </h3>
                    <p className="text-xs text-muted-foreground">Add key technical skills or mentorship domains.</p>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add a skill (e.g. React, System Design, Data Structures)..." 
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border/50 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddSkill} 
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      + Add Skill
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {skillsList.map((skill, idx) => (
                      <span key={idx} className="bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5">
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSkill(skill)} 
                          className="hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. RESUME UPLOAD SECTION */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Upload Resume Document
                    </h3>
                    <p className="text-xs text-muted-foreground">Upload your latest PDF resume to attach to your mentor profile.</p>
                  </div>

                  <input 
                    type="file" 
                    ref={resumeInputRef}
                    onChange={handleResumeSelect}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />

                  {resumeUrl ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground text-sm block">Resume Document Attached</span>
                          <span className="text-[11px] text-muted-foreground">Ready for verification & student viewing</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <a 
                          href={resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-card border border-border/60 hover:bg-muted text-foreground font-bold rounded-xl transition-all flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View PDF
                        </a>
                        <button 
                          type="button" 
                          onClick={() => setResumeUrl('')} 
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition-all text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => resumeInputRef.current?.click()}
                      className="border-2 border-dashed border-border/60 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                    >
                      <UploadCloud className="w-8 h-8 text-primary mx-auto animate-bounce" />
                      <p className="font-bold text-xs text-foreground">Click to Upload Resume (PDF / Word)</p>
                      <p className="text-[11px] text-muted-foreground">Supports .PDF, .DOC, .DOCX up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* Save All Changes Button */}
                <div className="pt-6 border-t border-border/40 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10 disabled:opacity-70 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                    Save Account Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Notification Preferences</h2>
              <p className="text-xs text-muted-foreground">Manage your notification settings.</p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Globe className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Profile Visibility</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Control who can see your mentor profile on the platform.</p>
                    <select 
                      value={profileVisibility}
                      onChange={(e) => {
                        setProfileVisibility(e.target.value);
                        fetch(`/api/users/${user.id}/profile`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ profileVisibility: e.target.value })
                        }).then(() => toast.success('Visibility updated'));
                      }}
                      className="bg-background border border-border/50 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="restricted">Verified Students Only</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Change Password</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Update your account password securely.</p>
                    <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-sm">
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Current Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="New Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center cursor-pointer">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Laptop className="w-5 h-5 text-primary shrink-0" />
                  <div className="w-full">
                    <h4 className="font-semibold text-sm text-foreground">Active Devices</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Devices that are currently logged into your account.</p>
                    <div className="space-y-3">
                      {sessions?.map(session => (
                        <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-background border border-border/50 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            {session.latestActivity?.isMobile ? <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" /> : <Laptop className="w-4 h-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground flex items-center flex-wrap gap-1.5 sm:gap-2">
                                <span className="truncate">{session.id === currentSession?.id 
                                  ? `${currentDeviceInfo.browser} on ${currentDeviceInfo.os}`
                                  : `${session.latestActivity?.browserName || 'Unknown Browser'} on ${session.latestActivity?.deviceType || 'Unknown Device'}`
                                }</span>
                                {session.id === currentSession?.id && <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">This Device</span>}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{session.id === currentSession?.id 
                                  ? `${currentDeviceInfo.city}, ${currentDeviceInfo.country} • ${currentDeviceInfo.ip}`
                                  : `${session.latestActivity?.city ? `${session.latestActivity.city}, ` : ''}${session.latestActivity?.country || 'Unknown Location'} • ${session.latestActivity?.ipAddress || 'IP Hidden'}`
                                }</span>
                              </p>
                            </div>
                          </div>
                          {session.id !== currentSession?.id && (
                            <button onClick={async () => {
                              try {
                                await session.revoke();
                                toast.success("Session revoked successfully");
                              } catch(e) {
                                toast.error("Failed to revoke session");
                              }
                            }} className="text-xs font-medium text-destructive hover:underline px-2 py-1">Revoke</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="flex gap-4 p-4 border border-destructive/30 bg-destructive/5 rounded-xl mt-8">
                  <Trash2 className="w-5 h-5 text-destructive shrink-0" />
                  <div className="w-full">
                    <h4 className="font-semibold text-sm text-destructive">Delete Account</h4>
                    <p className="text-xs text-destructive/80 mt-1 mb-3">Permanently remove your account and all associated data. This action cannot be undone.</p>
                    <button 
                      onClick={() => setIsConfirmOpen(true)}
                      className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your mentor account? This action cannot be undone."
      />

      {/* Render Image Crop Modal if active */}
      <AnimatePresence>
        {cropModalData && (
          <ImageCropModal 
            imageSrc={cropModalData.src}
            aspectRatio={1}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropModalData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MentorSettings
