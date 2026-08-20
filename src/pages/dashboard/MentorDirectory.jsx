import React, { useState, useEffect } from 'react'
import { Search, Filter, MapPin, ChevronLeft, ChevronRight, Loader2, UserPlus, CheckCircle2, Clock, MessageSquare, User, Calendar as CalendarIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'
import ConfirmModal from '../../components/modals/ConfirmModal'
import defaultPP from '../../assets/default_pp.png'

const MentorDirectory = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('discover') // 'discover' | 'myMentors'

  const [mentors, setMentors] = useState([])
  const [connections, setConnections] = useState({}) // map of clerkId -> status
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [domainFilter, setDomainFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [myMentorsList, setMyMentorsList] = useState([])
  const [myMentorsSearch, setMyMentorsSearch] = useState('')
  const [unfriendConfirm, setUnfriendConfirm] = useState({ isOpen: false, connectionId: null, targetName: '' })

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
          const connMap = {};
          const acceptedMentors = []
          
          connsData.forEach(c => {
            if (c.requesterClerkId === user.id) {
              connMap[c.recipientClerkId] = c.status;
              if (c.status === 'accepted' && ['mentor', 'alumni'].includes(c.targetUser?.role?.toLowerCase())) {
                acceptedMentors.push({
                  id: c._id,
                  clerkId: c.targetUser?.id,
                  name: c.targetUser?.name || 'Unknown Mentor',
                  company: c.targetUser?.university || 'Not specified',
                  role: c.targetUser?.interest || 'Mentor',
                  image: c.targetUser?.image || defaultPP,
                })
              }
            } else if (c.recipientClerkId === user.id) {
              connMap[c.requesterClerkId] = c.status;
            }
          });
          setConnections(connMap);
          setMyMentorsList(acceptedMentors);
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    } else {
      setIsLoading(false)
    }
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
          toast.error(`Server error: ${res.status}`)
        }
      }
    } catch (err) {
      toast.error(`Network error: ${err.message}`)
    } finally {
      setIsConnecting(null);
    }
  }

  const handleUnfriendConfirm = async () => {
    const { connectionId, targetName } = unfriendConfirm;
    if (!connectionId) return;
    try {
      const res = await fetch(`${API_BASE}/api/connections/${connectionId}`, { method: 'DELETE' });
      if (res.ok) {
        // Find the mentor's clerkId to update connections map
        const mentorToRemove = myMentorsList.find(m => m.id === connectionId);
        
        setMyMentorsList(prev => prev.filter(m => m.id !== connectionId));
        if (mentorToRemove) {
          setConnections(prev => {
            const next = { ...prev };
            delete next[mentorToRemove.clerkId];
            return next;
          });
        }
        toast.success(`${targetName} removed from mentors.`);
      } else {
        toast.error('Failed to remove mentor.');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setUnfriendConfirm({ isOpen: false, connectionId: null, targetName: '' })
    }
  }

  const filteredMentors = mentors.filter(mentor => {
    if (connections[mentor.clerkId] === 'accepted') return false;
    
    const fullName = `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim().toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          (mentor.headline || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (mentor.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDomain = domainFilter === '' || (mentor.headline || '').toLowerCase().includes(domainFilter.toLowerCase())
    const matchesLocation = locationFilter === '' || (mentor.location || '').toLowerCase().includes(locationFilter.toLowerCase())
    return matchesSearch && matchesDomain && matchesLocation
  })

  const filteredMyMentors = myMentorsList.filter(mentor => 
    mentor.name.toLowerCase().includes(myMentorsSearch.toLowerCase()) ||
    mentor.company.toLowerCase().includes(myMentorsSearch.toLowerCase()) ||
    mentor.role.toLowerCase().includes(myMentorsSearch.toLowerCase())
  )

  const totalPages = Math.ceil(filteredMentors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMentors = filteredMentors.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, domainFilter, locationFilter, activeTab])

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-8">
      {/* Header & Tabs */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Mentor Directory</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Find and connect with mentors from your college.</p>
        
        <div className="flex border-b border-border/40 mt-6 gap-6">
          <button 
            onClick={() => setActiveTab('discover')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'discover' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Discover Mentors
          </button>
          <button 
            onClick={() => setActiveTab('myMentors')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'myMentors' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            My Mentors
            {myMentorsList.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'myMentors' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {myMentorsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'discover' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Filters and Search for Discover */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-5xl">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, headline or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground text-sm"
              />
              {isDropdownOpen && searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl z-50 max-h-[350px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                  {filteredMentors.length > 0 ? (
                    filteredMentors.slice(0, 8).map(mentor => (
                      <div key={`dropdown-${mentor._id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                        <Link to={`/dashboard/mentor/${mentor.clerkId}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <img src={mentor.imageUrl || defaultPP} alt={mentor.firstName} className="w-10 h-10 rounded-full object-cover shrink-0 bg-muted" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-foreground leading-tight truncate">{mentor.firstName} {mentor.lastName || ''}</span>
                            <span className="text-xs text-muted-foreground mt-0.5 truncate">{mentor.headline || 'Mentor'}</span>
                          </div>
                        </Link>
                        <div className="pl-2 shrink-0">
                          {connections[mentor.clerkId] === 'pending' ? (
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelRequest(mentor.clerkId); }}
                              disabled={isConnecting === mentor.clerkId}
                              className="text-xs font-medium text-amber-500 hover:text-rose-500 border border-amber-500/20 hover:border-rose-500/30 hover:bg-rose-500/10 bg-amber-500/10 px-3 py-1 rounded-full transition-colors flex items-center gap-1 group"
                            >
                              {isConnecting === mentor.clerkId ? <Loader2 className="w-3 h-3 animate-spin" /> : <><span className="group-hover:hidden">Request Sent ⏳</span><span className="hidden group-hover:inline">Unsend ✖</span></>}
                            </button>
                          ) : connections[mentor.clerkId] === 'accepted' ? (
                            <button disabled className="text-xs font-medium text-green-500 border border-green-500/20 bg-green-500/10 px-3 py-1 rounded-full cursor-default">
                              Connected
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConnect(mentor.clerkId); }}
                              disabled={isConnecting === mentor.clerkId}
                              className="text-xs font-medium text-primary border border-primary/20 hover:bg-primary/10 px-3 py-1 rounded-full transition-colors flex items-center gap-1">
                              {isConnecting === mentor.clerkId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Connect'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No matches found</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
              <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="flex-1 sm:flex-none bg-card border border-border/50 rounded-xl px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-xs sm:text-sm">
                <option value="">All Domains</option>
                <option value="engineer">Engineering</option>
                <option value="design">Design</option>
                <option value="product">Product</option>
              </select>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="flex-1 sm:flex-none bg-card border border-border/50 rounded-xl px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-xs sm:text-sm">
                <option value="">All Locations</option>
                <option value="bangalore">Bangalore</option>
                <option value="remote">Remote</option>
                <option value="usa">USA</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 max-w-5xl">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : paginatedMentors.length > 0 ? (
              paginatedMentors.map(mentor => (
                <div key={mentor._id} className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-row items-center gap-4 sm:gap-5 min-w-0">
                    <img src={mentor.imageUrl || defaultPP} alt={mentor.firstName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shrink-0 bg-muted border border-border/50" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{mentor.firstName} {mentor.lastName || ''}</h3>
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{mentor.headline || 'Mentor'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{mentor.location || 'Location not specified'}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                        {mentor.skills?.slice(0, 4).map((skill, index) => (
                          <span key={index} className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium border border-border/50">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-nowrap gap-1.5 sm:gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto mt-2 sm:mt-0">
                    {connections[mentor.clerkId] === 'pending' ? (
                      <button 
                        onClick={(e) => { e.preventDefault(); handleCancelRequest(mentor.clerkId); }}
                        disabled={isConnecting === mentor.clerkId}
                        className="flex-1 sm:flex-none text-amber-500 hover:text-rose-500 font-bold text-[10px] sm:text-sm border border-amber-500/30 hover:border-rose-500/30 bg-amber-500/10 hover:bg-rose-500/10 px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors group shadow-sm shadow-amber-500/10"
                      >
                        {isConnecting === mentor.clerkId ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <><span className="group-hover:hidden flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Request Sent</span><span className="hidden group-hover:flex items-center gap-1.5"><X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Unsend</span></>}
                      </button>
                    ) : connections[mentor.clerkId] === 'accepted' ? (
                      <button disabled className="flex-1 sm:flex-none text-green-500 font-medium text-[10px] sm:text-sm border border-green-500/20 bg-green-500/10 px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1 sm:gap-2 cursor-default">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Connected
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect(mentor.clerkId)}
                        disabled={isConnecting === mentor.clerkId}
                        className="flex-1 sm:flex-none text-primary-foreground font-medium text-[10px] sm:text-sm bg-primary hover:bg-primary/90 px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1 sm:gap-2 shadow-sm shadow-primary/20"
                      >
                        {isConnecting === mentor.clerkId ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Connect</>}
                      </button>
                    )}
                    <Link to={`/dashboard/mentor/${mentor.clerkId}/book`} className="flex-1 sm:flex-none text-primary border border-primary hover:bg-primary/10 font-medium text-[10px] sm:text-sm bg-background px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center justify-center">Book Session</Link>
                    <Link to={`/dashboard/mentor/${mentor.clerkId}`} className="flex-1 sm:flex-none text-foreground font-medium text-[10px] sm:text-sm border border-border/50 hover:bg-muted bg-background px-2 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center justify-center">View Profile</Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-card border border-border/50 rounded-2xl"><p className="text-muted-foreground">No mentors found matching your criteria.</p></div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 max-w-5xl">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-border/50 rounded-lg hover:bg-muted disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3 && currentPage < totalPages - 2) pageNum = currentPage - 2 + i;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                }
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${currentPage === pageNum ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>{pageNum}</button>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && <><span className="text-muted-foreground">...</span><button onClick={() => setCurrentPage(totalPages)} className="w-8 h-8 rounded-lg hover:bg-muted text-foreground text-sm font-medium flex items-center justify-center transition-colors">{totalPages}</button></>}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border border-border/50 rounded-lg hover:bg-muted disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'myMentors' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative w-full sm:w-64 max-w-5xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search my mentors..."
              value={myMentorsSearch}
              onChange={(e) => setMyMentorsSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredMyMentors.map((mentor) => (
                <div key={mentor.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                  <div className="p-4 sm:p-5 flex-1 text-center relative">
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                      <span className="bg-green-500/10 text-green-500 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    </div>
                    <img src={mentor.image} alt={mentor.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto mb-3 sm:mb-4 border-2 border-primary/20" />
                    <h3 className="font-bold text-foreground text-base sm:text-lg truncate">{mentor.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mentor.role}</p>
                    <p className="text-[10px] font-medium text-foreground/70 uppercase tracking-widest mt-1 truncate">{mentor.company}</p>
                  </div>
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 mt-2 sm:mt-4">
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <button onClick={() => navigate(`/dashboard/mentor/${mentor.clerkId}`)} className="flex items-center justify-center gap-1 bg-background border border-border/50 hover:bg-muted py-2 rounded-lg text-[11px] sm:text-xs font-medium"><User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Profile</span></button>
                      <button onClick={() => navigate(`/dashboard/mentor/${mentor.clerkId}/book`)} className="flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-[11px] sm:text-xs font-medium shadow-sm"><CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Book</span></button>
                      <button className="flex items-center justify-center gap-1 bg-background border border-border/50 hover:bg-muted py-2 rounded-lg text-[11px] sm:text-xs font-medium"><MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Chat</span></button>
                    </div>
                    <button onClick={() => setUnfriendConfirm({ isOpen: true, connectionId: mentor.id, targetName: mentor.name })} className="w-full mt-2 flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-colors">
                      Unfriend
                    </button>
                  </div>
                </div>
              ))}
              {filteredMyMentors.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">No mentors found.</div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={unfriendConfirm.isOpen}
        onClose={() => setUnfriendConfirm({ isOpen: false, connectionId: null, targetName: '' })}
        onConfirm={handleUnfriendConfirm}
        title="Remove Mentor"
        message={`Are you sure you want to remove ${unfriendConfirm.targetName} from your mentors? They will no longer appear in your list.`}
        confirmText="Remove"
        isDestructive={true}
      />
    </div>
  )
}

export default MentorDirectory
