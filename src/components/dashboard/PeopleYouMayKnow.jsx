import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Users, 
  GraduationCap, 
  Briefcase, 
  ArrowRight,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';
import defaultPP from '../../assets/default_pp.png';

const PeopleYouMayKnow = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  // Suggestions state for carousel
  const [suggestions, setSuggestions] = useState([]);
  const [connectionStates, setConnectionStates] = useState({});
  const [isConnecting, setIsConnecting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Discover Modal states
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverRole, setDiscoverRole] = useState('all'); // 'all' | 'student' | 'mentor'
  const [discoverResults, setDiscoverResults] = useState([]);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);

  // Helper to determine proper profile route
  const getProfilePath = (targetClerkId, targetRole) => {
    const role = sessionStorage.getItem('campusbridge_user_role') || user?.publicMetadata?.role || 'student';
    const base = ['mentor', 'alumni'].includes(role?.toLowerCase()) ? '/mentor-dashboard' : '/dashboard';
    const targetType = ['mentor', 'alumni'].includes(targetRole?.toLowerCase()) ? 'mentor' : 'student';
    return `${base}/${targetType}/${targetClerkId}`;
  };

  // Fetch initial suggestions for carousel
  const fetchSuggestions = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/connections/suggestions/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Error fetching suggested connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user]);

  // Fetch Discover People (Modal)
  const fetchDiscoverPeople = async (search = '', role = 'all') => {
    if (!user?.id) return;
    setIsDiscoverLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('q', search.trim());
      if (role !== 'all') queryParams.set('role', role);

      const res = await fetch(`${API_BASE}/api/connections/discover/${user.id}?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDiscoverResults(data);
        // Pre-populate connection states from discover data
        const states = {};
        data.forEach(item => {
          if (item.connectionStatus && item.connectionStatus !== 'none') {
            states[item.clerkId] = item.connectionStatus;
          }
        });
        setConnectionStates(prev => ({ ...prev, ...states }));
      }
    } catch (err) {
      console.error('Error fetching discover people:', err);
    } finally {
      setIsDiscoverLoading(false);
    }
  };

  // Trigger search on debounce in modal
  useEffect(() => {
    if (!isDiscoverModalOpen) return;
    const timer = setTimeout(() => {
      fetchDiscoverPeople(discoverQuery, discoverRole);
    }, 300);
    return () => clearTimeout(timer);
  }, [discoverQuery, discoverRole, isDiscoverModalOpen]);

  // Open modal
  const openDiscoverModal = (roleFilter = 'all') => {
    setDiscoverRole(roleFilter);
    setIsDiscoverModalOpen(true);
    fetchDiscoverPeople(discoverQuery, roleFilter);
  };

  // Handle Connect
  const handleConnect = async (targetClerkId, targetName) => {
    if (!user) return;
    setIsConnecting(targetClerkId);
    try {
      const res = await fetch(`${API_BASE}/api/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: targetClerkId,
          message: 'Hi! I would like to connect with you on CampusBridge.'
        })
      });

      if (res.ok) {
        toast.success(`Connection request sent to ${targetName}! 🎉`);
        setConnectionStates((prev) => ({ ...prev, [targetClerkId]: 'pending' }));
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to send request');
      }
    } catch (err) {
      console.error('Connect error:', err);
      toast.error('Could not send connection request');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleCancelRequest = async (targetClerkId) => {
    if (!user) return;
    setIsConnecting(targetClerkId);
    try {
      const res = await fetch(`${API_BASE}/api/connections/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterClerkId: user.id,
          recipientClerkId: targetClerkId
        })
      });

      if (res.ok) {
        toast.success(`Connection request cancelled.`);
        setConnectionStates((prev) => ({ ...prev, [targetClerkId]: 'none' }));
      } else {
        toast.error('Failed to cancel request');
      }
    } catch (err) {
      console.error('Error cancelling:', err);
      toast.error('Network error.');
    } finally {
      setIsConnecting(null);
    }
  };

  // Horizontal Scroll Handler
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-3.5 sm:p-5 shadow-sm space-y-3 sm:space-y-4 relative overflow-hidden">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight">People You May Know</h3>
            <p className="text-[11px] text-muted-foreground hidden sm:block">Connect with peers, alumni and industry mentors</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Scroll Navigation Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => handleScroll('left')}
              className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-all hover:shadow-xs"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-1 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-all hover:shadow-xs"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View More / See All Button */}
          <button
            onClick={() => openDiscoverModal('all')}
            className="text-[11px] sm:text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all flex items-center gap-1"
          >
            <span>See all</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {suggestions.map((item) => {
          const status = connectionStates[item.clerkId] || 'none';
          const isMentor = ['mentor', 'alumni'].includes(item.role?.toLowerCase());
          const profileLink = getProfilePath(item.clerkId, item.role);

          return (
            <div
              key={item.clerkId}
              className="w-32 sm:w-44 md:w-48 shrink-0 snap-start bg-background/60 hover:bg-background/90 border border-border/50 hover:border-primary/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center text-center space-y-2 sm:space-y-3 hover:shadow-md transition-all group relative"
            >
              {/* Profile Image with role ring */}
              <Link to={profileLink} className="relative block">
                <img
                  src={item.image || defaultPP}
                  alt={item.name}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                    isMentor ? 'ring-2 ring-purple-500/40' : 'ring-2 ring-primary/30'
                  }`}
                />
                <span className={`absolute -bottom-1 -right-1 text-[8px] sm:text-[9px] font-bold uppercase px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs ${
                  isMentor ? 'bg-purple-600 text-white' : 'bg-primary text-primary-foreground'
                }`}>
                  {isMentor ? 'Mentor' : 'Student'}
                </span>
              </Link>

              {/* User Details */}
              <div className="flex-1 w-full space-y-0.5 sm:space-y-1">
                <Link
                  to={profileLink}
                  className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors block truncate max-w-full"
                  title={item.name}
                >
                  {item.name}
                </Link>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1 sm:line-clamp-2 leading-tight">
                  {item.headline || item.institution || `${item.role} at CampusBridge`}
                </p>
              </div>

              {/* Action Button */}
              <div className="w-full pt-0.5">
                {status === 'pending' ? (
                  <button
                    onClick={(e) => { e.preventDefault(); handleCancelRequest(item.clerkId); }}
                    disabled={isConnecting === item.clerkId}
                    className="w-full text-[10px] sm:text-xs font-semibold text-amber-500 hover:text-rose-500 border border-amber-500/30 hover:border-rose-500/30 bg-amber-500/10 hover:bg-rose-500/10 py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-colors group"
                  >
                    {isConnecting === item.clerkId ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <><span className="group-hover:hidden flex items-center gap-1"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Sent</span><span className="hidden group-hover:flex items-center gap-1"><X className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Unsend</span></>}
                  </button>
                ) : status === 'accepted' ? (
                  <button
                    disabled
                    className="w-full text-[10px] sm:text-xs font-semibold text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 cursor-default"
                  >
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Connected
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(item.clerkId, item.name)}
                    disabled={isConnecting === item.clerkId}
                    className="w-full text-[10px] sm:text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs"
                  >
                    {isConnecting === item.clerkId ? (
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* End "Discover More" Card */}
        <div 
          onClick={() => openDiscoverModal('all')}
          className="w-28 sm:w-40 md:w-44 shrink-0 snap-start bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30 hover:border-primary/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3 cursor-pointer transition-all group"
        >
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center transition-all group-hover:scale-110">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">Discover</h4>
            <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5">Explore more</p>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-primary inline-flex items-center gap-0.5">
            All →
          </span>
        </div>
      </div>

      {/* Discover & Search People Modal (Insta/LinkedIn style) */}
      <AnimatePresence>
        {isDiscoverModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDiscoverModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Discover People</h2>
                    <p className="text-xs text-muted-foreground">Search and connect with students, alumni, and mentors</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDiscoverModalOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filter Section */}
              <div className="p-4 sm:p-5 border-b border-border/40 bg-muted/10 space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={discoverQuery}
                    onChange={(e) => setDiscoverQuery(e.target.value)}
                    placeholder="Search by name, role, college, company, or skills..."
                    className="w-full pl-10 pr-10 py-2.5 bg-background border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground"
                    autoFocus
                  />
                  {discoverQuery && (
                    <button
                      onClick={() => setDiscoverQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setDiscoverRole('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      discoverRole === 'all'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                  >
                    All Members
                  </button>
                  <button
                    onClick={() => setDiscoverRole('student')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                      discoverRole === 'student'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" /> Students
                  </button>
                  <button
                    onClick={() => setDiscoverRole('mentor')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                      discoverRole === 'mentor'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Mentors & Alumni
                  </button>
                </div>
              </div>

              {/* Modal Body: Users Grid */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                {isDiscoverLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Searching across CampusBridge network...</p>
                  </div>
                ) : discoverResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {discoverResults.map((item) => {
                      const status = connectionStates[item.clerkId] || item.connectionStatus || 'none';
                      const isMentor = ['mentor', 'alumni'].includes(item.role?.toLowerCase());
                      const profileLink = getProfilePath(item.clerkId, item.role);

                      return (
                        <div
                          key={item.clerkId}
                          className="bg-background/80 border border-border/50 hover:border-primary/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <Link 
                              to={profileLink} 
                              onClick={() => setIsDiscoverModalOpen(false)}
                              className="shrink-0 relative"
                            >
                              <img
                                src={item.image || defaultPP}
                                alt={item.name}
                                className={`w-12 h-12 rounded-full object-cover shadow-xs transition-transform group-hover:scale-105 ${
                                  isMentor ? 'ring-2 ring-purple-500/40' : 'ring-2 ring-primary/30'
                                }`}
                              />
                            </Link>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Link
                                  to={profileLink}
                                  onClick={() => setIsDiscoverModalOpen(false)}
                                  className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block"
                                  title={item.name}
                                >
                                  {item.name}
                                </Link>
                              </div>
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                                isMentor ? 'bg-purple-500/10 text-purple-600' : 'bg-primary/10 text-primary'
                              }`}>
                                {item.role}
                              </span>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {item.headline || item.institution || 'CampusBridge Member'}
                              </p>
                            </div>
                          </div>

                          {/* Institution / Skills tags if available */}
                          {item.institution && (
                            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 truncate pt-1 border-t border-border/30">
                              {isMentor ? <Briefcase className="w-3 h-3 text-purple-500 shrink-0" /> : <GraduationCap className="w-3 h-3 text-primary shrink-0" />}
                              <span className="truncate">{item.institution}</span>
                            </p>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-0 pl-0 sm:pl-4 shrink-0 flex items-center justify-end">
                              {status === 'pending' ? (
                                <button
                                  onClick={(e) => { e.preventDefault(); handleCancelRequest(item.clerkId); }}
                                  disabled={isConnecting === item.clerkId}
                                  className="w-full sm:w-32 text-xs sm:text-sm font-semibold text-amber-500 hover:text-rose-500 border border-amber-500/30 hover:border-rose-500/30 bg-amber-500/10 hover:bg-rose-500/10 py-2 sm:py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 group shadow-sm"
                                >
                                  {isConnecting === item.clerkId ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <><span className="group-hover:hidden flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Sent</span><span className="hidden group-hover:flex items-center gap-1.5"><X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Unsend</span></>}
                                </button>
                              ) : status === 'accepted' ? (
                                <button
                                  disabled
                                  className="w-full text-xs font-semibold text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 py-2 rounded-xl flex items-center justify-center gap-1 cursor-default"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleConnect(item.clerkId, item.name)}
                                  disabled={isConnecting === item.clerkId}
                                  className="w-full text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                  {isConnecting === item.clerkId ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="w-3.5 h-3.5" /> Connect
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <Link
                              to={profileLink}
                              onClick={() => setIsDiscoverModalOpen(false)}
                              className="p-2 rounded-xl border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                              title="View Profile"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">No people found</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {discoverQuery 
                        ? `No results matching "${discoverQuery}". Try adjusting your search keywords.` 
                        : 'No additional members found in this category.'}
                    </p>
                    {discoverQuery && (
                      <button
                        onClick={() => {
                          setDiscoverQuery('');
                          setDiscoverRole('all');
                        }}
                        className="text-xs font-semibold text-primary hover:underline pt-2"
                      >
                        Clear search filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {discoverResults.length} CampusBridge member{discoverResults.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => setIsDiscoverModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PeopleYouMayKnow;

