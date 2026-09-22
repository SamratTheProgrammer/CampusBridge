import React, { useState, useEffect } from 'react'
import UserSkeleton from '../../components/skeletons/UserSkeleton'
import { Search, Filter, MessageSquare, User, CheckCircle2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { formatConnectionTime } from '../../utils/dateFormatter'
import { socket } from '../../services/socket'

const MyMentees = () => {
  const navigate = useNavigate();
  const { user } = useUser()
  const [mentees, setMentees] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [unfriendConfirm, setUnfriendConfirm] = useState({ isOpen: false, connectionId: null, targetName: '' })
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
              clerkId: conn.targetUser?.clerkId || conn.requesterClerkId,
              name: conn.targetUser?.name || 'Unknown User',
              course: conn.targetUser?.course || 'Course not specified',
              university: conn.targetUser?.university || 'University not specified',
              skills: conn.targetUser?.interest ? [conn.targetUser.interest] : ['Not specified'],
              status: 'Active',
              image: conn.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conn.targetUser?.name}`,
              progress: Math.floor(Math.random() * 100),
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

  // Track online users in real-time
  useEffect(() => {
    if (!user?.id) return;

    const handleOnlineUsers = (users) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    };

    socket.emit('register_user', user.id);
    socket.emit('get_online_users');

    socket.on('online_users_update', handleOnlineUsers);
    socket.on('connect', () => {
      socket.emit('register_user', user.id);
      socket.emit('get_online_users');
    });

    return () => {
      socket.off('online_users_update', handleOnlineUsers);
    };
  }, [user?.id]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredMentees.length / itemsPerPage);
  const currentMentees = filteredMentees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full max-w-full mx-auto space-y-4 sm:space-y-5 px-1 sm:px-3">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Students</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage and track your students' progress.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-background border border-border/50 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-9 pr-8 py-1.5 sm:py-2 bg-background border border-border/50 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
            <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <UserSkeleton key={i} variant="grid" />
          ))}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
        {currentMentees.map((mentee) => {
          const isOnline = onlineUsers.includes(mentee.clerkId) ||
                           onlineUsers.includes(mentee.fullProfile?.clerkId) ||
                           onlineUsers.includes(mentee.fullProfile?._id) ||
                           onlineUsers.includes(mentee.id);

          const profileUrl = `/profile/${mentee.fullProfile?.username || mentee.fullProfile?.clerkId || mentee.clerkId || mentee.id}`;

          return (
            <div 
              key={mentee.id} 
              onClick={() => navigate(profileUrl)}
              className="bg-card border border-border/50 hover:border-primary/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
            >

              <div>
                {/* Header: Avatar + Student info + Status */}
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={mentee.image}
                      alt={mentee.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-border/50 shadow-xs cursor-pointer hover:opacity-85 transition-opacity"
                      title="View Profile"
                    />
                    <span 
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                        isOnline ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-400'
                      }`} 
                      title={isOnline ? 'Active Now (Online)' : 'Offline'} 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 
                        className="font-bold text-foreground text-sm sm:text-[15px] truncate leading-tight group-hover:text-primary transition-colors cursor-pointer"
                        title="View Profile"
                      >
                        {mentee.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        isOnline 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' 
                          : 'bg-muted text-muted-foreground border border-border/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {isOnline ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">{mentee.course}</p>
                    <p className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider truncate mt-0.5">{mentee.university}</p>
                  </div>
                </div>

                {/* Skills/Tags if available */}
                {mentee.skills && mentee.skills.length > 0 && mentee.skills[0] !== 'Not specified' && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {mentee.skills.slice(0, 2).map((skill, index) => (
                      <span key={index} className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mentorship Progress (Compact) */}
                <div className="mt-2.5 pt-2 border-t border-border/30">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-muted-foreground font-medium">Mentorship Progress</span>
                    <span className="text-primary font-bold">{mentee.progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${mentee.progress}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Actions: Full-width Message button and Remove button */}
              <div 
                className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetClerkId = mentee.clerkId || mentee.fullProfile?.clerkId;
                    navigate(`/mentor-dashboard/messages${targetClerkId ? `?user=${targetClerkId}` : ''}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs shadow-primary/20 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfriend(mentee.id, mentee.name);
                  }}
                  title="Remove Student"
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0 border border-border/40 hover:border-red-500/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredMentees.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No students found matching your search.
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredMentees.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
            if (
              page === 1 || 
              page === totalPages || 
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                    currentPage === page 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {page}
                </button>
              )
            } else if (
              page === currentPage - 2 || 
              page === currentPage + 2
            ) {
              return <span key={page} className="text-muted-foreground">...</span>
            }
            return null;
          })}

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-border/50 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      </>
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
