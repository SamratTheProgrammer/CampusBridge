import React, { useState, useEffect } from 'react'
import { Check, X, FileText, ExternalLink, ShieldCheck, Loader2, User, Building, Briefcase, GraduationCap, Clock, Award, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminVerification = () => {
  const [activeTab, setActiveTab] = useState('Pending')
  const [verifications, setVerifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  // Fetch verifications from backend API
  const fetchVerifications = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/verifications')
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.verifications)) {
          setVerifications(data.verifications)
        }
      } else {
        toast.error('Failed to load mentor verification requests')
      }
    } catch (err) {
      console.error('Error fetching verifications:', err)
      toast.error('Server error while loading verifications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVerifications()
  }, [])

  // Handle Approve or Reject
  const handleAction = async (id, newStatus, name) => {
    try {
      setUpdatingId(id)
      const res = await fetch(`/api/admin/verifications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: newStatus, isVerified: newStatus === 'Approved' } : v))
        if (selectedMentor && selectedMentor.id === id) {
          setSelectedMentor(prev => prev ? { ...prev, status: newStatus, isVerified: newStatus === 'Approved' } : null)
        }
        if (newStatus === 'Approved') {
          toast.success(`${name} has been successfully verified!`)
        } else {
          toast.error(`${name}'s verification was set to ${newStatus}.`)
        }
      } else {
        toast.error(data.message || 'Failed to update verification status')
      }
    } catch (err) {
      console.error('Error updating verification status:', err)
      toast.error('Failed to communicate with server')
    } finally {
      setUpdatingId(null)
    }
  }

  const counts = {
    Pending: verifications.filter(v => v.status === 'Pending').length,
    Approved: verifications.filter(v => v.status === 'Approved').length,
    Rejected: verifications.filter(v => v.status === 'Rejected').length,
  }

  const currentList = verifications.filter(v => v.status === activeTab)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Mentor Verification</h1>
          <p className="text-muted-foreground text-sm mt-1">Verify credentials, work profiles, and graduation documentation submitted by mentors.</p>
        </div>
        <button 
          onClick={fetchVerifications}
          disabled={isLoading}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-muted border border-border/60 text-foreground hover:bg-muted/80 transition-all flex items-center gap-1.5"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Refresh List
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 gap-2 overflow-x-auto">
        {['Pending', 'Approved', 'Rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab} 
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
              activeTab === tab ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border/40 text-muted-foreground'
            }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-card border border-border/50 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading mentor verifications from database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.length > 0 ? (
            currentList.map((mentor) => (
              <div key={mentor.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden">
                {mentor.status === 'Approved' && (
                  <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </div>
                )}
                {mentor.status === 'Rejected' && (
                  <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-rose-500/20 flex items-center gap-1">
                    <X className="w-3 h-3" /> Rejected
                  </div>
                )}

                <div>
                  <div className="flex gap-4 items-start">
                    <img 
                      src={mentor.image} 
                      alt={mentor.name} 
                      className="w-14 h-14 rounded-full object-cover border border-border/40 shrink-0" 
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-bold text-foreground flex items-center gap-1.5 text-base truncate">
                        {mentor.name}
                        {mentor.status === 'Approved' && <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-500/10 shrink-0" />}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{mentor.email}</p>
                      <p className="text-xs font-semibold text-foreground bg-muted inline-block px-2.5 py-1 rounded-lg border border-border/50 mt-1 max-w-full truncate">
                        {mentor.role} at {mentor.company}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5 font-medium">Graduated</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-primary" /> {mentor.gradYear}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5 font-medium">Experience</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-primary" /> {mentor.experience}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-2">
                  <button 
                    onClick={() => setSelectedMentor(mentor)}
                    className="flex-1 px-4 py-2 border border-border/60 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Profile
                  </button>

                  {mentor.status === 'Pending' && (
                    <>
                      <button 
                        disabled={updatingId === mentor.id}
                        onClick={() => handleAction(mentor.id, 'Approved', mentor.name)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
                      >
                        {updatingId === mentor.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                      </button>
                      <button 
                        disabled={updatingId === mentor.id}
                        onClick={() => handleAction(mentor.id, 'Rejected', mentor.name)}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/10 disabled:opacity-50 cursor-pointer"
                      >
                        {updatingId === mentor.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 py-16 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl flex flex-col items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-sm">No mentor verification records found in "{activeTab}".</p>
              <p className="text-xs text-muted-foreground mt-1">When new mentors register or apply, their credentials will appear here for review.</p>
            </div>
          )}
        </div>
      )}

      {/* Mentor Profile Details Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/60 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMentor(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex gap-4 items-center border-b border-border/40 pb-6">
              <img 
                src={selectedMentor.image} 
                alt={selectedMentor.name} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{selectedMentor.name}</h2>
                  {selectedMentor.status === 'Approved' && (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Mentor
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedMentor.email}</p>
                <p className="text-xs font-semibold text-primary bg-primary/10 inline-block px-3 py-1 rounded-lg border border-primary/20 mt-2">
                  {selectedMentor.role} at {selectedMentor.company}
                </p>
              </div>
            </div>

            {/* Profile Grid Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-muted/50 p-3.5 rounded-xl border border-border/40">
                <span className="text-muted-foreground block mb-1 font-medium">Graduation Year</span>
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" /> {selectedMentor.gradYear}
                </span>
              </div>
              <div className="bg-muted/50 p-3.5 rounded-xl border border-border/40">
                <span className="text-muted-foreground block mb-1 font-medium">Total Experience</span>
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary" /> {selectedMentor.experience}
                </span>
              </div>
            </div>

            {/* About / Bio */}
            {selectedMentor.aboutMe && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">About Mentor</h4>
                <p className="text-xs text-foreground bg-muted/30 p-3.5 rounded-xl border border-border/40 leading-relaxed">
                  {selectedMentor.aboutMe}
                </p>
              </div>
            )}

            {/* Work Experience History */}
            {selectedMentor.experienceList && selectedMentor.experienceList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Work Experience</h4>
                <div className="space-y-2">
                  {selectedMentor.experienceList.map((exp, idx) => (
                    <div key={idx} className="bg-muted/30 p-3 rounded-xl border border-border/40 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>{exp.title}</span>
                        <span className="text-primary">{exp.duration}</span>
                      </div>
                      <p className="text-muted-foreground font-semibold">{exp.company}</p>
                      {exp.description && <p className="text-muted-foreground leading-snug">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Credentials */}
            {selectedMentor.educationList && selectedMentor.educationList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Education Credentials</h4>
                <div className="space-y-2">
                  {selectedMentor.educationList.map((edu, idx) => (
                    <div key={idx} className="bg-muted/30 p-3 rounded-xl border border-border/40 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>{edu.degree}</span>
                        <span className="text-primary">{edu.duration}</span>
                      </div>
                      <p className="text-muted-foreground font-semibold">{edu.institution}</p>
                      {edu.grade && <p className="text-muted-foreground">Grade: {edu.grade}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {selectedMentor.skills && selectedMentor.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expertise & Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMentor.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-lg border border-border/40">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions in Modal */}
            <div className="pt-4 border-t border-border/40 flex justify-between items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Status: <strong className={`font-bold ${
                  selectedMentor.status === 'Approved' ? 'text-emerald-500' : selectedMentor.status === 'Rejected' ? 'text-rose-500' : 'text-amber-500'
                }`}>{selectedMentor.status}</strong>
              </span>

              <div className="flex gap-2">
                {selectedMentor.status !== 'Approved' && (
                  <button 
                    onClick={() => handleAction(selectedMentor.id, 'Approved', selectedMentor.name)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Mentor
                  </button>
                )}
                {selectedMentor.status !== 'Rejected' && (
                  <button 
                    onClick={() => handleAction(selectedMentor.id, 'Rejected', selectedMentor.name)}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" /> Reject Mentor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminVerification
