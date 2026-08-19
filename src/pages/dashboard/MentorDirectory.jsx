import React, { useState, useEffect } from 'react'
import { Search, Filter, MapPin, ChevronLeft, ChevronRight, Loader2, UserPlus, CheckCircle2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mentorsRes, connsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/mentors/all`),
          user ? fetch(`${API_BASE}/api/connections/user/${user.id}`) : Promise.resolve({ ok: false })
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
      const res = await fetch(`${API_BASE}/api/connections`, {
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
    const fullName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim().toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          (mentor.headline || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (mentor.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Simple mock domain filter since actual domains might be complex (using headline for now)
    const matchesDomain = domainFilter === '' || (mentor.headline || '').toLowerCase().includes(domainFilter.toLowerCase())
    
    const matchesLocation = locationFilter === '' || (mentor.location || '').toLowerCase().includes(locationFilter.toLowerCase())

    return matchesSearch && matchesDomain && matchesLocation
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredMentors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMentors = filteredMentors.slice(startIndex, startIndex + itemsPerPage)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, domainFilter, locationFilter])

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mentor Directory</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Find and connect with mentor from your college.</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground text-sm"
          />

          {/* FB/Insta Style Dropdown Search Results */}
          {isDropdownOpen && searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl z-50 max-h-[350px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
              {filteredMentors.length > 0 ? (
                filteredMentors.slice(0, 8).map(mentor => (
                  <div key={`dropdown-${mentor._id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <Link to={`/dashboard/mentor/${mentor.clerkId}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <img src={mentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.firstName}`} alt={mentor.firstName} className="w-10 h-10 rounded-full object-cover shrink-0 bg-muted" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground leading-tight truncate">{mentor.firstName} {mentor.lastName || ''}</span>
                        <span className="text-xs text-muted-foreground mt-0.5 truncate">{mentor.headline || 'Mentor'}</span>
                      </div>
                    </Link>
                    <div className="pl-2 shrink-0">
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
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          <select 
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-card border border-border/50 rounded-xl px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer appearance-none min-w-[120px] text-xs sm:text-sm"
          >
            <option value="">All Domains</option>
            <option value="engineer">Engineering</option>
            <option value="design">Design</option>
            <option value="product">Product</option>
          </select>
          <select 
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-card border border-border/50 rounded-xl px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground cursor-pointer appearance-none min-w-[120px] text-xs sm:text-sm"
          >
            <option value="">All Locations</option>
            <option value="bangalore">Bangalore</option>
            <option value="remote">Remote</option>
            <option value="usa">USA</option>
          </select>
          <button className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 p-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Directory List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : paginatedMentors.length > 0 ? (
          paginatedMentors.map(mentor => (
            <div key={mentor._id} className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition-shadow">
              <div className="flex flex-row items-center gap-4 sm:gap-5 min-w-0">
                <img src={mentor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.firstName}`} alt={mentor.firstName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shrink-0 bg-muted border border-border/50" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{mentor.firstName} {mentor.lastName || ''}</h3>
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{mentor.headline || 'Mentor'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{mentor.location || 'Location not specified'}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                    {mentor.skills?.slice(0, 4).map((skill, index) => (
                      <span key={index} className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium border border-border/50">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-row sm:flex-nowrap gap-1.5 sm:gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto mt-2 sm:mt-0">
                {connections[mentor.clerkId] === 'pending' ? (
                  <button disabled className="flex-1 sm:flex-none text-amber-500 font-medium text-[10px] sm:text-sm border border-amber-500/20 bg-amber-500/10 px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl text-center shrink-0 flex items-center justify-center gap-1 sm:gap-2 cursor-not-allowed">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Requested
                  </button>
                ) : connections[mentor.clerkId] === 'accepted' ? (
                  <button disabled className="flex-1 sm:flex-none text-green-500 font-medium text-[10px] sm:text-sm border border-green-500/20 bg-green-500/10 px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl text-center shrink-0 flex items-center justify-center gap-1 sm:gap-2 cursor-default">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Connected
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(mentor.clerkId)}
                    disabled={isConnecting === mentor.clerkId}
                    className="flex-1 sm:flex-none text-primary-foreground font-medium text-[10px] sm:text-sm bg-primary hover:bg-primary/90 px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all text-center shrink-0 flex items-center justify-center gap-1 sm:gap-2 shadow-sm shadow-primary/20"
                  >
                    {isConnecting === mentor.clerkId ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Connect</>}
                  </button>
                )}
                
                <Link
                  to={`/dashboard/mentor/${mentor.clerkId}/book`}
                  className="flex-1 sm:flex-none text-primary border border-primary hover:bg-primary/10 font-medium text-[10px] sm:text-sm bg-background px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all text-center shrink-0 flex items-center justify-center"
                >
                  Book Session
                </Link>
                <Link
                  to={`/dashboard/mentor/${mentor.clerkId}`}
                  className="flex-1 sm:flex-none text-foreground font-medium text-[10px] sm:text-sm border border-border/50 hover:bg-muted bg-background px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl transition-all text-center shrink-0 flex items-center justify-center"
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Logic to show a window of pages around currentPage
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage > 3 && currentPage < totalPages - 2) {
                pageNum = currentPage - 2 + i;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              }
            }
            
            return (
              <button 
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                  currentPage === pageNum 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {pageNum}
              </button>
            )
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-muted-foreground">...</span>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default MentorDirectory
