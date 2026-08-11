import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, User, Calendar, MessageSquare, BookOpen, Loader2, Globe, MapPin, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import API_BASE from '../../utils/api'

const MentorshipRequests = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pending')
  const [connectionRequests, setConnectionRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true)

      // Fetch connection requests
      const connRes = await fetch(`${API_BASE}/api/connections/user/${user.id}`)
      if (connRes.ok) {
        const data = await connRes.json()
        const received = data.filter(conn => conn.recipientClerkId === user.id)
        setConnectionRequests(received)
      }
    } catch (err) {
      console.error('Error fetching mentorship data:', err)
      toast.error('Failed to load requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    fetchData()
  }, [user])

  const handleConnectionAction = async (id, action) => {
    try {
      const status = action === 'accept' ? 'accepted' : 'declined'
      const res = await fetch(`${API_BASE}/api/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        toast.success(`Connection ${status} successfully!`)
        fetchData()
      } else {
        toast.error('Failed to update request')
      }
    } catch (err) {
      toast.error('An error occurred')
    }
  }

  const filteredConnections = connectionRequests.filter(c => {
    if (activeTab === 'pending') return c.status === 'pending'
    if (activeTab === 'accepted') return c.status === 'accepted'
    if (activeTab === 'declined') return c.status === 'declined'
    return true
  })

  const totalPending = connectionRequests.filter(c => c.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mentorship Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage your incoming mentorship connection requests.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-xl w-full sm:w-fit">
            {['pending', 'accepted', 'declined'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none sm:px-6 py-2.5 text-sm font-medium rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {tab === 'pending' && totalPending > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center bg-primary text-primary-foreground text-[10px] w-4.5 h-4.5 rounded-full font-bold">
                    {totalPending}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Connection Requests Section */}
          <div className="space-y-4 mt-8">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Mentorship Connection Requests ({filteredConnections.length})
            </h2>

            <div className="space-y-4">
              {filteredConnections.map((conn) => (
                <div key={conn._id} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
                  <img src={conn.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conn.targetUser?.name}`} alt="User" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-foreground">{conn.targetUser?.name || 'Student'}</h3>
                        <p className="text-xs text-muted-foreground">{conn.targetUser?.course || 'Student Profile'}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {conn.createdAt ? formatDistanceToNow(new Date(conn.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">"{conn.message || 'I would like to connect with you.'}"</p>
                    {activeTab === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleConnectionAction(conn._id, 'accept')} className="bg-primary text-primary-foreground text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button onClick={() => handleConnectionAction(conn._id, 'decline')} className="bg-muted text-foreground text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredConnections.length === 0 && (
                <div className="bg-card border border-border/50 rounded-2xl p-6 text-center text-sm text-muted-foreground">
                  No {activeTab} connection requests.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MentorshipRequests
