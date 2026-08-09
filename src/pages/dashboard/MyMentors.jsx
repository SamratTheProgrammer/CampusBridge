import React, { useState, useEffect } from 'react'
import { Search, MessageSquare, User, Loader2, CheckCircle2, Calendar } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const MyMentors = () => {
  const { user } = useUser()
  const [mentors, setMentors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return;
    
    const fetchMentors = async () => {
      try {
        const res = await fetch(`/api/connections/user/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only accepted requests where the current user is the requester (student)
          const acceptedMentors = data
            .filter(conn => conn.requesterClerkId === user.id && conn.status === 'accepted' && ['mentor', 'alumni'].includes(conn.targetUser?.role?.toLowerCase()))
            .map(conn => ({
              id: conn._id,
              clerkId: conn.targetUser?.id,
              name: conn.targetUser?.name || 'Unknown Mentor',
              company: conn.targetUser?.university || 'Not specified', // Using university field for company/role in mock
              role: conn.targetUser?.interest || 'Mentor',
              image: conn.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conn.targetUser?.name}`,
            }));
          setMentors(acceptedMentors);
        }
      } catch (err) {
        console.error('Error fetching mentors:', err);
        toast.error('Failed to load mentors');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMentors();
  }, [user]);

  const filteredMentors = mentors.filter(mentor => 
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Mentors</h1>
          <p className="text-sm text-muted-foreground mt-1">People you are connected with for mentorship.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMentors.map((mentor) => (
            <div key={mentor.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-5 flex-1 text-center relative">
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                </div>
                <img
                  src={mentor.image}
                  alt={mentor.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary/20"
                />
                <h3 className="font-bold text-foreground text-lg">{mentor.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{mentor.role}</p>
                <p className="text-[10px] font-medium text-foreground/70 uppercase tracking-widest mt-1">{mentor.company}</p>
              </div>

              <div className="px-5 pb-5 mt-4">
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => navigate(`/dashboard/mentor/${mentor.clerkId}`)}
                    className="flex items-center justify-center gap-1 bg-background border border-border/50 hover:bg-muted text-foreground py-2 rounded-lg text-xs font-medium transition-colors">
                    <User className="w-3.5 h-3.5" /> Profile
                  </button>
                  <button 
                    onClick={() => navigate(`/dashboard/mentor/${mentor.clerkId}/book`)}
                    className="flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-xs font-medium transition-colors shadow-sm shadow-primary/20">
                    <Calendar className="w-3.5 h-3.5" /> Book
                  </button>
                  <button className="flex items-center justify-center gap-1 bg-background border border-border/50 hover:bg-muted text-foreground py-2 rounded-lg text-xs font-medium transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredMentors.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No mentors found matching your search.
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default MyMentors
