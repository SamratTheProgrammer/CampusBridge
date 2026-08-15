import React, { useState, useEffect } from 'react'
import { Mail, Send, Phone, MapPin, MessageSquare, CheckCircle2, ShieldAlert, History, Calendar } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

const ContactSection = () => {
  const { user, isSignedIn } = useUser()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    clerkId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [history, setHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const fetchHistory = async (clerkId) => {
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`${API_BASE}/api/support/user/${clerkId}`)
      const data = await res.json()
      if (data.success) {
        setHistory(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch history', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && user) {
      const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
      const userEmail = user.primaryEmailAddress?.emailAddress || ''
      setFormData(prev => ({
        ...prev,
        name: prev.name || fullName,
        email: prev.email || userEmail,
        clerkId: user.id
      }))
      fetchHistory(user.id)
    }
  }, [user, isSignedIn])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        setIsSubmitted(true)
        toast.success('Your message has been delivered to CampusBridge Support & Admin!')
        setFormData({ name: '', email: '', subject: '', message: '' })
        if (isSignedIn && user) {
           fetchHistory(user.id)
        }
      } else {
        toast.error(data.message || 'Failed to send message.')
      }
    } catch (err) {
      console.error('Contact submit error:', err)
      toast.error('Could not connect to server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact-us" className="py-24 bg-background relative overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" /> Contact & Support
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            We're Here to Help You
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Have questions, feedback, or need account unblocking support? Reach out to the CampusBridge team anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-foreground">Get in Touch Directly</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Whether you need technical assistance, partnership details, or account reinstatement, our team processes all support requests within 24 hours.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Official Contact & Support Email</span>
                    <a href="mailto:campusbridgeofficial3@gmail.com" className="text-sm font-bold text-primary hover:underline transition-colors break-all">
                      campusbridgeofficial3@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Headquarters</span>
                    <p className="text-sm font-bold text-foreground">CampusBridge HQ, Tech Hub Campus</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 text-xs text-muted-foreground">
              <span className="font-bold text-foreground block mb-1">⚡ Fast-Track Account Appeal</span>
              If your account has been blocked or suspended by administration, please include your registered account email and reason for appeal.
            </div>

            {isSignedIn && (
              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4 max-h-[400px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Your Support History</h3>
                </div>
                {isLoadingHistory ? (
                  <p className="text-xs text-muted-foreground animate-pulse">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">You have no previous support requests.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((msg, idx) => (
                      <div key={idx} className="border border-border/50 rounded-2xl p-4 bg-muted/20 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-foreground text-sm line-clamp-1" title={msg.subject}>{msg.subject || 'Inquiry'}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            msg.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                            msg.status === 'Replied' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{msg.message}</p>
                        
                        {msg.adminReply && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <span className="text-[10px] font-bold text-primary block mb-1">Admin Reply:</span>
                            <p className="text-xs text-foreground bg-primary/5 p-2 rounded-lg">{msg.adminReply}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Side */}
          <div className="lg:col-span-7">
            <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                  <h3 className="text-2xl font-bold text-foreground">Message Delivered!</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you for contacting CampusBridge. Our administration team will review your message and reach out to your email shortly.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">Your Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">Subject</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Account Unblock Request / Inquiry"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">Message *</label>
                    <textarea 
                      rows="5"
                      required
                      placeholder="Type your message or appeal request here..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
