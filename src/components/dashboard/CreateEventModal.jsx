import React, { useState } from 'react'
import { X, Calendar as CalendarIcon, MapPin, Video, Users, Globe, Lock, Users2, Image as ImageIcon, CheckCircle2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateEventModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1) // 1: Form, 2: Success/Management
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    startTime: '',
    eventType: 'in-person', // in-person, virtual-live, virtual-link
    location: '',
    virtualLink: '',
    privacy: 'public', // public, private, group
    description: '',
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.startDate || !formData.startTime) {
      toast.error('Please fill in all required fields.')
      return
    }
    // Mock API call
    toast.success('Event published successfully!')
    setStep(2)
  }

  const handleClose = () => {
    setStep(1)
    setFormData({
      name: '',
      startDate: '',
      startTime: '',
      eventType: 'in-person',
      location: '',
      virtualLink: '',
      privacy: 'public',
      description: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border/50 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur z-10 flex items-center justify-between p-4 sm:p-6 border-b border-border/40">
          <h2 className="text-xl font-bold text-foreground">
            {step === 1 ? 'Create New Event' : 'Event Published'}
          </h2>
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
              
              {/* Event Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Event Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Tech Startup Networking Meet" 
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Start Date *</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="date" 
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full bg-muted/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Start Time *</label>
                  <input 
                    type="time" 
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
                  />
                </div>
              </div>

              {/* Event Type & Location */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-foreground">Event Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, eventType: 'in-person' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                      ${formData.eventType === 'in-person' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                  >
                    <MapPin className="w-4 h-4" /> In-person
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, eventType: 'virtual-live' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                      ${formData.eventType === 'virtual-live' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                  >
                    <Video className="w-4 h-4" /> Live
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, eventType: 'virtual-link' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                      ${formData.eventType === 'virtual-link' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                  >
                    <Globe className="w-4 h-4" /> External Link
                  </button>
                </div>

                {formData.eventType === 'in-person' && (
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Add location (e.g., Seminar Hall, Block A)" 
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all mt-2 animate-in fade-in zoom-in-95"
                  />
                )}
                {formData.eventType === 'virtual-link' && (
                  <input 
                    type="url" 
                    name="virtualLink"
                    value={formData.virtualLink}
                    onChange={handleChange}
                    placeholder="Add external link (Zoom, Meet, etc.)" 
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all mt-2 animate-in fade-in zoom-in-95"
                  />
                )}
              </div>

              {/* Privacy Controls */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Privacy Preference
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">Note: Privacy settings cannot be changed after creation.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacy: 'public' }))}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all text-center
                      ${formData.privacy === 'public' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                  >
                    <Globe className="w-5 h-5 mb-1" /> 
                    <span className="text-sm font-medium">Public</span>
                    <span className="text-[10px] opacity-70">Anyone can see</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacy: 'private' }))}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all text-center
                      ${formData.privacy === 'private' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                  >
                    <Lock className="w-5 h-5 mb-1" /> 
                    <span className="text-sm font-medium">Private</span>
                    <span className="text-[10px] opacity-70">Only invited guests</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacy: 'group' }))}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all text-center
                      ${formData.privacy === 'group' ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                  >
                    <Users2 className="w-5 h-5 mb-1" /> 
                    <span className="text-sm font-medium">Group</span>
                    <span className="text-[10px] opacity-70">Specific groups</span>
                  </button>
                </div>
              </div>

              {/* Cover Photo */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Cover Photo</label>
                <label className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      if(e.target.files?.length) toast.success(`Cover photo selected: ${e.target.files[0].name}`)
                    }}
                  />
                  <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-foreground">Add a cover photo</span>
                  <span className="text-xs text-muted-foreground mt-1">Recommended size: 1200 x 628</span>
                </label>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="What is this event about?"
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit Action */}
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
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
                >
                  Create Event
                </button>
              </div>
            </form>
          ) : (
            <div className="py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">"{formData.name}" is Live!</h3>
                <p className="text-muted-foreground">Start inviting people and managing your event.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => toast.success('Invite dialog opened!')} className="bg-primary text-primary-foreground hover:bg-primary/90 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors shadow-sm">
                  <Users className="w-6 h-6" />
                  <span className="font-semibold text-sm">Send Direct Invites</span>
                </button>
                <button onClick={() => toast.success('Co-host management opened!')} className="bg-muted text-foreground hover:bg-muted/80 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors border border-border/50">
                  <Users2 className="w-6 h-6" />
                  <span className="font-semibold text-sm">Add Co-hosts</span>
                </button>
                <button onClick={() => toast.success('Guest list opened! (Going, Interested, Not Going)')} className="bg-muted text-foreground hover:bg-muted/80 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors border border-border/50">
                  <FileText className="w-6 h-6" />
                  <span className="font-semibold text-sm">Track Guest List</span>
                </button>
                <button onClick={() => toast.success('Announcement creator opened!')} className="bg-muted text-foreground hover:bg-muted/80 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-colors border border-border/50">
                  <Globe className="w-6 h-6" />
                  <span className="font-semibold text-sm">Post Announcement</span>
                </button>
              </div>

              <div className="pt-6 border-t border-border/40 text-center">
                <button 
                  onClick={handleClose}
                  className="text-primary font-semibold text-sm hover:underline"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateEventModal
