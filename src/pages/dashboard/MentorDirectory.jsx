import React, { useState, useEffect } from 'react'
import { Search, Filter, MapPin, ChevronLeft, ChevronRight, Loader2, UserPlus, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

const MentorDirectory = () => {
  const { user } = useUser()
  const [mentors, setMentors] = useState([])
  const [connections, setConnections] = useState({}) // map of clerkId -> status
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [domainFilter, setDomainFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(null) // store ID of mentor being connected

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mentorsRes, connsRes] = await Promise.all([
          fetch('/api/users/mentors/all'),
          user ? fetch(`/api/connections/user/${user.id}`) : Promise.resolve({ ok: false })
        ]);

        if (mentorsRes.ok) {
          const data = await mentorsRes.json()
          setMentors(data)
        }

        if (connsRes.ok) {
          const connsData = await connsRes.json()
          // create a map of recipientId -> status
          const connMap = {};
          connsData.forEach(c => {
            if (c.requesterClerkId === user.id) {
              connMap[c.recipientClerkId] = c.status;
            } else if (c.recipientClerkId === user.id) {
              connMap[c.requesterClerkId] = c.status;
            }
          });
          setConnections(connMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleConnect = async (mentorId) => {
    if (!user) return;
    setIsConnecting(mentorId);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: mentorId,
          message: 'Hi, I would like to connect with you on CampusBridge.'
        })
      });
      if (res.ok) {
        setConnections(prev => ({ ...prev, [mentorId]: 'pending' }))
        toast.success('Connection request sent!')
      } else {
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          toast.error(data.message || 'Failed to connect')
        } catch (e) {
          console.error('Invalid JSON response:', text)
          toast.error(`Server error: ${res.status}`)
        }
      }
    } catch (err) {
      console.error('Connection request failed:', err)
      toast.error(`Network error: ${err.message}`)
    } finally {
      setIsConnecting(null);
    }
  }

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = (mentor.firstName + ' ' + mentor.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (mentor.headline || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (mentor.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Simple mock domain filter since actual domains might be complex (using headline for now)
    const matchesDomain = domainFilter === '' || (mentor.headline || '').toLowerCase().includes(domainFilter.toLowerCase())
    
    const matchesLocation = locationFilter === '' || (mentor.location || '').toLowerCase().includes(locationFilter.toLowerCase())

    return matchesSearch && matchesDomain && matchesLocation
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mentor Directory</h1>
        <p className="text-muted-foreground">Find and connect with mentor from your college.</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, headline or skills..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsDropdownOpen(true)
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
          />

          {/* FB/Insta Style Dropdown Search Results */}
          {isDropdownOpen && searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl z-50 max-h-[350px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
              {filteredMentors.length > 0 ? (
                filteredMentors.slice(0, 8).map(mentor => (
                  <div key={`dropdown-${mentor._id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <Link to={`/dashboard/mentor/${mentor.clerkId}`} className="flex items-center gap-3 flex-1">
                      <img src={mentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.firstName}`} alt={mentor.firstName} className="w-10 h-10 rounded-full object-cover shrink-0 bg-muted" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground leading-tight">{mentor.firstName} {mentor.lastName}</span>
                        <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mentor.headline || 'Mentor'}</span>
                      </div>
                    </Link>
                    <div className="pl-2">
                      {connections[mentor.clerkId] === 'pending' ? (
                        <button disabled className="text-xs font-medium text-amber-500 border border-amber-500/20 bg-amber-500/10 px-3 py-1 rounded-full cursor-not-allowed flex items-center gap-1">
                           Request Sent ⏳
                        </button>
                      ) : connections[mentor.clerkId] === 'accepted' ? (
                        <button disabled className="text-xs font-medium text-green-500 border border-green-500/20 bg-green-500/10 px-3 py-1 rounded-full cursor-default">
                          Connected
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleConnect(mentor.clerkId);
                          }}
                          disabled={isConnecting === mentor.clerkId}
                          className="text-xs font-medium text-primary border border-primary/20 hover:bg-primary/10 px-3 py-1 rounded-full transition-colors flex items-center gap-1">
                          {isConnecting === mentor.clerkId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No matches found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <select 
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="bg-card border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="">All Domains</option>
            <option value="engineer">Engineering</option>
            <option value="design">Design</option>
            <option value="product">Product</option>
          </select>
          <select 
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-card border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="">All Locations</option>
            <option value="bangalore">Bangalore</option>
            <option value="remote">Remote</option>
            <option value="usa">USA</option>
          </select>
          <button className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 p-2.5 rounded-xl transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Directory List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMentors.length > 0 ? (
          filteredMentors.map(mentor => (
            <div key={mentor._id} className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <img src={mentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.firstName}`} alt={mentor.firstName} className="w-16 h-16 rounded-full object-cover shrink-0 bg-muted" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">{mentor.firstName} {mentor.lastName}</h3>
                  <p className="text-sm font-medium text-foreground">{mentor.headline || 'Mentor'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {mentor.location || 'Location not specified'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {mentor.skills?.slice(0, 4).map((skill, index) => (
                      <span key={index} className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-[10px] font-medium border border-border/50">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                {connections[mentor.clerkId] === 'pending' ? (
                  <button disabled className="text-amber-500 font-medium text-sm border border-amber-500/20 bg-amber-500/10 px-6 py-2.5 rounded-xl text-center shrink-0 flex items-center justify-center gap-2 cursor-not-allowed">
                    <Clock className="w-4 h-4" /> Request Sent ⏳
                  </button>
                ) : connections[mentor.clerkId] === 'accepted' ? (
                  <button disabled className="text-green-500 font-medium text-sm border border-green-500/20 bg-green-500/10 px-6 py-2.5 rounded-xl text-center shrink-0 flex items-center justify-center gap-2 cursor-default">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(mentor.clerkId)}
                    disabled={isConnecting === mentor.clerkId}
                    className="text-primary-foreground font-medium text-sm bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl transition-all text-center shrink-0 flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                  >
                    {isConnecting === mentor.clerkId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Connect</>}
                  </button>
                )}
                
                <Link
                  to={`/dashboard/mentor/${mentor.clerkId}`}
                  className="text-foreground font-medium text-sm border border-border/50 hover:bg-muted bg-background px-6 py-2.5 rounded-xl transition-all text-center shrink-0"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card border border-border/50 rounded-2xl">
            <p className="text-muted-foreground">No mentors found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <button className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50" disabled>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">1</button>
        <button className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors">2</button>
        <button className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors">3</button>
        <span className="text-muted-foreground">...</span>
        <button className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors">20</button>
        <button className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default MentorDirectory
