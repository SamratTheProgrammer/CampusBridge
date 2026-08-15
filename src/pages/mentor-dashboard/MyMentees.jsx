import React, { useState, useEffect } from 'react'
import { Search, Filter, MessageSquare, User, CheckCircle2, Loader2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'
import ConfirmModal from '../../components/modals/ConfirmModal'

const MyMentees = () => {
  const navigate = useNavigate();
  const { user } = useUser()
  const [mentees, setMentees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [unfriendConfirm, setUnfriendConfirm] = useState({ isOpen: false, connectionId: null, targetName: '' })

  useEffect(() => {
    if (!user) return;
    
    const fetchMentees = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/connections/user/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only accepted requests where the current user is the recipient (mentor)
          const acceptedMentees = data
            .filter(conn => conn.recipientClerkId === user.id && conn.status === 'accepted')
            .map(conn => ({
              id: conn._id,
              name: conn.targetUser?.name || 'Unknown User',
              course: conn.targetUser?.course || 'Course not specified',
              university: conn.targetUser?.university || 'University not specified',
              skills: conn.targetUser?.interest ? [conn.targetUser.interest] : ['Not specified'],
              status: 'Active', // Mocking progress/status for now
              image: conn.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conn.targetUser?.name}`,
              progress: Math.floor(Math.random() * 100), // Mocking progress
              fullProfile: conn.targetUser,
              interest: conn.targetUser?.interest
            }));
          setMentees(acceptedMentees);
        }
      } catch (err) {
        console.error('Error fetching mentees:', err);
        toast.error('Failed to load mentees');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMentees();
  }, [user]);

  const handleUnfriendConfirm = async () => {
    const { connectionId, targetName } = unfriendConfirm;
    if (!connectionId) return;
    try {
      const res = await fetch(`${API_BASE}/api/connections/${connectionId}`, { method: 'DELETE' });
      if (res.ok) {
        setMentees(prev => prev.filter(m => m.id !== connectionId));
        toast.success(`${targetName} removed from mentees.`);
        setUnfriendConfirm({ isOpen: false, connectionId: null, targetName: '' });
      } else {
        toast.error('Failed to remove mentee.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  }

  const handleUnfriend = (connectionId, studentName) => {
    setUnfriendConfirm({ isOpen: true, connectionId, targetName: studentName });
  }

  const filteredMentees = mentees.filter(mentee => {
    const matchesSearch = mentee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentee.course.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || mentee.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Students</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your students' progress.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMentees.map((mentee) => (
          <div key={mentee.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">

            <div className="p-5 flex-1 text-center relative">
              <div className="absolute top-4 right-4">
                {mentee.status === 'Active' ? (
                  <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    {mentee.status}
                  </span>
                ) : (
                  <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {mentee.status}
                  </span>
                )}
              </div>
              <img
                src={mentee.image}
                alt={mentee.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary/20"
              />
              <h3 className="font-bold text-foreground text-lg">{mentee.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{mentee.course}</p>
              <p className="text-[10px] font-medium text-foreground/70 uppercase tracking-widest mt-1">{mentee.university}</p>

              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {mentee.skills.map((skill, index) => (
                  <span key={index} className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Mentorship Progress</span>
                  <span className="text-primary font-bold">{mentee.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${mentee.progress}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => navigate(`/mentor-dashboard/student/${mentee.fullProfile?.id || mentee.fullProfile?.clerkId}`)}
                  className="flex items-center justify-center gap-2 bg-background border border-border/50 hover:bg-muted text-foreground py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  <User className="w-4 h-4" /> Profile
                </button>
                <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-xs font-medium transition-colors shadow-sm shadow-primary/20">
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              </div>
              <button 
                onClick={() => handleUnfriend(mentee.id, mentee.name)}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <X className="w-4 h-4" /> Remove Student
              </button>
            </div>
          </div>
        ))}

        {filteredMentees.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No students found matching your search.
          </div>
        )}
      </div>
      )}

      <ConfirmModal
        isOpen={unfriendConfirm.isOpen}
        onClose={() => setUnfriendConfirm({ isOpen: false, connectionId: null, targetName: '' })}
        onConfirm={handleUnfriendConfirm}
        title="Remove Mentee"
        message={`Are you sure you want to remove ${unfriendConfirm.targetName} from your mentees?`}
        confirmText="Remove"
        isDestructive={true}
      />
    </div>
  )
}

export default MyMentees
