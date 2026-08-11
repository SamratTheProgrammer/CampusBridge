import React, { useState, useEffect } from 'react'
import { 
  Mail, Search, Filter, Clock, CheckCircle2, AlertCircle, MessageSquare, 
  Trash2, Send, User, Shield, ChevronRight, RefreshCw, Eye, Sparkles, ExternalLink, CornerUpLeft, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

// Helper to generate domain-smart webmail URLs
const getEmailLinks = (email, subject = '') => {
  if (!email) return {}
  const encEmail = encodeURIComponent(email)
  const encSubject = encodeURIComponent(subject ? `Re: ${subject}` : 'CampusBridge Support')
  
  const domain = email.split('@')[1]?.toLowerCase() || ''

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encEmail}&su=${encSubject}`
  const outlookWebUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encEmail}&subject=${encSubject}`
  const yahooUrl = `https://compose.mail.yahoo.com/?to=${encEmail}&subject=${encSubject}`
  const defaultMailto = `mailto:${email}?subject=${encSubject}`

  let primaryUrl = gmailUrl
  let primaryName = 'Gmail Web'
  let primaryColor = 'text-red-500 bg-red-500/10 border-red-500/20'
  
  if (domain.includes('gmail.com')) {
    primaryUrl = gmailUrl
    primaryName = 'Gmail Web'
    primaryColor = 'text-red-500 bg-red-500/10 border-red-500/20'
  } else if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com') || domain.includes('microsoft.com')) {
    primaryUrl = outlookWebUrl
    primaryName = 'Outlook Web'
    primaryColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  } else if (domain.includes('yahoo.com')) {
    primaryUrl = yahooUrl
    primaryName = 'Yahoo Mail'
    primaryColor = 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  }

  return {
    primaryUrl,
    primaryName,
    primaryColor,
    domain,
    gmailUrl,
    outlookWebUrl,
    yahooUrl,
    defaultMailto
  }
}

const AdminSupportMessages = () => {
  const [messages, setMessages] = useState([])
  const [counts, setCounts] = useState({ total: 0, pending: 0, replied: 0, resolved: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [userProfileModal, setUserProfileModal] = useState(null)
  const [showMailDropdown, setShowMailDropdown] = useState(false)

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages || [])
        setCounts(data.counts || { total: 0, pending: 0, replied: 0, resolved: 0 })
        if (data.messages?.length > 0 && !selectedMessage) {
          setSelectedMessage(data.messages[0])
        }
      } else {
        toast.error('Failed to load support messages.')
      }
    } catch (err) {
      console.error('Error fetching support messages:', err)
      toast.error('Error connecting to server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!selectedMessage || !replyText.trim()) {
      toast.error('Please enter a reply message.')
      return
    }

    setIsSendingReply(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages/${selectedMessage._id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: replyText.trim() })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('🎉 Reply sent successfully!')
        setReplyText('')
        
        // Update local state
        const updatedMsg = data.data
        setSelectedMessage(updatedMsg)
        setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m))
        
        // Recalculate counts
        fetchMessages()
      } else {
        toast.error(data.message || 'Failed to send reply.')
      }
    } catch (err) {
      console.error('Send reply error:', err)
      toast.error('Failed to send reply.')
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleUpdateStatus = async (msgId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages/${msgId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Message status updated to ${newStatus}`)
        if (selectedMessage && selectedMessage._id === msgId) {
          setSelectedMessage(data.data)
        }
        fetchMessages()
      } else {
        toast.error('Failed to update status.')
      }
    } catch (err) {
      console.error('Update status error:', err)
      toast.error('Failed to update status.')
    }
  }

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages/${msgId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Support message deleted.')
        const remaining = messages.filter(m => m._id !== msgId)
        setMessages(remaining)
        if (selectedMessage?._id === msgId) {
          setSelectedMessage(remaining[0] || null)
        }
        fetchMessages()
      } else {
        toast.error('Failed to delete message.')
      }
    } catch (err) {
      console.error('Delete message error:', err)
      toast.error('Failed to delete message.')
    }
  }

  // Filter messages based on search query and status filter
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'All' || msg.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const activeEmailLinks = selectedMessage ? getEmailLinks(selectedMessage.email, selectedMessage.subject) : {}

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Support & Help Messages</h1>
            <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Inbox
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage inquiries, help requests, and account unblock appeals submitted by users.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-border/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterStatus('All')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'All' ? 'bg-card border-primary/50 ring-2 ring-primary/20 shadow-md' : 'bg-card border-border/50 hover:border-primary/30'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{counts.total}</p>
        </div>

        <div 
          onClick={() => setFilterStatus('Pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Pending' ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20 shadow-md' : 'bg-card border-border/50 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Pending</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">{counts.pending}</p>
        </div>

        <div 
          onClick={() => setFilterStatus('Replied')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Replied' ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/20 shadow-md' : 'bg-card border-border/50 hover:border-blue-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Replied</span>
            <CornerUpLeft className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-500">{counts.replied}</p>
        </div>

        <div 
          onClick={() => setFilterStatus('Resolved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Resolved' ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-md' : 'bg-card border-border/50 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500">{counts.resolved}</p>
        </div>
      </div>

      {/* Main Mail Inbox Container */}
      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">

        {/* Left Column: Mail List */}
        <div className="lg:col-span-5 border-r border-border/40 flex flex-col bg-background/50">
          
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-border/40 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by sender, email, or subject..."
                className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border/50 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {['All', 'Pending', 'Replied', 'Resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p>Loading messages...</p>
              </div>
            ) : filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?._id === msg._id
                return (
                  <div
                    key={msg._id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-4 transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected 
                        ? 'bg-primary/10 border-l-4 border-primary' 
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    {/* Sender Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {msg.name ? msg.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-foreground text-xs truncate">{msg.name}</h4>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(msg.createdAt)}</span>
                      </div>

                      <p className="text-xs font-semibold text-foreground/90 truncate">{msg.subject}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{msg.message}</p>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          msg.status === 'Pending' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : msg.status === 'Replied'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {msg.status}
                        </span>

                        {/* View Profile Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setUserProfileModal({
                              name: msg.name,
                              email: msg.email,
                              subject: msg.subject,
                              message: msg.message,
                              date: formatDate(msg.createdAt)
                            })
                          }}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                        >
                          Profile <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                <Mail className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p className="font-bold">No messages found</p>
                <p className="text-[11px]">Try adjusting your search query or filter criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mail Details & Reply View */}
        <div className="lg:col-span-7 flex flex-col bg-card">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col h-full">

              {/* Reader Header */}
              <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary border-2 border-primary/30 flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                    {selectedMessage.name ? selectedMessage.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                      {selectedMessage.name}
                      <button
                        onClick={() => setUserProfileModal({
                          name: selectedMessage.name,
                          email: selectedMessage.email,
                          subject: selectedMessage.subject,
                          message: selectedMessage.message,
                          date: formatDate(selectedMessage.createdAt)
                        })}
                        className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <User className="w-3 h-3" /> View Profile
                      </button>
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">{selectedMessage.email}</p>
                      
                      {/* Direct Smart Webmail Button */}
                      {activeEmailLinks.primaryUrl && (
                        <a
                          href={activeEmailLinks.primaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${activeEmailLinks.primaryColor}`}
                          title={`Open directly in ${activeEmailLinks.primaryName}`}
                        >
                          <ExternalLink className="w-3 h-3" /> Open {activeEmailLinks.primaryName}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => handleUpdateStatus(selectedMessage._id, e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 bg-background border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Pending">Status: Pending</option>
                    <option value="Replied">Status: Replied</option>
                    <option value="Resolved">Status: Resolved</option>
                  </select>

                  <button
                    onClick={() => handleDeleteMessage(selectedMessage._id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Subject & Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                    Subject Line • {formatDate(selectedMessage.createdAt)}
                  </span>
                  <h2 className="text-xl font-black text-foreground">{selectedMessage.subject}</h2>
                </div>

                <div className="bg-background/80 border border-border/50 rounded-2xl p-5 space-y-3 shadow-inner">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                    Submitted User Message / Appeal
                  </span>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>

                {/* Show Admin Reply if already replied */}
                {selectedMessage.adminReply && (
                  <div className="bg-primary/5 border border-primary/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-primary">
                      <span className="flex items-center gap-1.5">
                        <CornerUpLeft className="w-4 h-4" /> Admin Sent Reply
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {formatDate(selectedMessage.repliedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.adminReply}
                    </p>
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="pt-4 border-t border-border/40 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                    Compose Official Reply as Admin
                  </label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type your reply to ${selectedMessage.name}...`}
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-2xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-muted-foreground">
                      Replying will automatically mark this message status as <strong className="text-blue-500 font-bold">Replied</strong>.
                    </p>

                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim()}
                      className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground m-auto space-y-2">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground/30" />
              <p className="font-bold text-base text-foreground">Select a message to view details</p>
              <p>Choose an item from the left inbox list to inspect and reply.</p>
            </div>
          )}
        </div>

      </div>

      {/* User Profile Modal Drawer */}
      {userProfileModal && (() => {
        const links = getEmailLinks(userProfileModal.email, userProfileModal.subject)
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <div className="bg-card border border-border/60 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary border-2 border-primary/30 flex items-center justify-center font-bold text-lg">
                    {userProfileModal.name ? userProfileModal.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">{userProfileModal.name}</h3>
                    <p className="text-xs text-muted-foreground">{userProfileModal.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setUserProfileModal(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/40 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">Sender Email Address</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground text-sm">{userProfileModal.email}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${links.primaryColor}`}>
                      {links.domain}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                    <span className="text-[10px] text-muted-foreground block font-bold">Account Role</span>
                    <span className="font-bold text-primary">Student / Campus Member</span>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                    <span className="text-[10px] text-muted-foreground block font-bold">Account Status</span>
                    <span className="font-bold text-emerald-500">Active</span>
                  </div>
                </div>

                <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/40 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">Submitted Topic</span>
                  <span className="font-medium text-foreground">{userProfileModal.subject}</span>
                </div>
              </div>

              {/* Webmail Choice Section */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Select Webmail Client to Email User
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* Primary Domain Webmail */}
                  <a
                    href={links.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Open in {links.primaryName}
                  </a>

                  {/* Gmail Web */}
                  <a
                    href={links.gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-border/50"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Gmail Web
                  </a>

                  {/* Outlook Web */}
                  <a
                    href={links.outlookWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-border/50"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Outlook Web
                  </a>

                  {/* Yahoo Web */}
                  <a
                    href={links.yahooUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-border/50"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Yahoo Web
                  </a>

                  {/* Native App (mailto) */}
                  <a
                    href={links.defaultMailto}
                    className="px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-border/50"
                  >
                    <Mail className="w-3.5 h-3.5" /> Desktop App
                  </a>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setUserProfileModal(null)}
                  className="px-5 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default AdminSupportMessages
