import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, CheckCircle2, Clock, MessageSquare, Video, Check, X, Search, Loader2, Sparkles, Building, GraduationCap } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import API_BASE from '../../utils/api'
import ConfirmModal from '../../components/modals/ConfirmModal'

const MyNetwork = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('connections'); // 'connections' | 'pending' | 'discover'
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(null);
  const [unfriendConfirm, setUnfriendConfirm] = useState({ isOpen: false, connectionId: null, targetName: '' });

  // Fetch connections and suggestions
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const [connRes, sugRes] = await Promise.all([
          fetch(`${API_BASE}/api/connections/user/${user.id}`),
          fetch(`${API_BASE}/api/connections/suggestions/${user.id}`)
        ]);

        if (connRes.ok) {
          const connData = await connRes.json();
          setConnections(connData);
        }

        if (sugRes.ok) {
          const sugData = await sugRes.json();
          setSuggestions(sugData);
        }
      } catch (err) {
        console.error('Error loading network data:', err);
        toast.error('Failed to load network');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Handle Accept / Decline connection request
  const handleUpdateStatus = async (connectionId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Request ${newStatus === 'accepted' ? 'accepted 🎉' : 'declined'}`);
        setConnections((prev) =>
          prev.map((c) => (c._id === connectionId ? { ...c, status: newStatus } : c))
        );
      } else {
        toast.error('Failed to update request');
      }
    } catch (err) {
      console.error('Update request error:', err);
      toast.error('Could not update request');
    }
  };

  // Handle send new connection request
  const handleSendRequest = async (targetClerkId, targetName) => {
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
        const newConn = await res.json();
        toast.success(`Request sent to ${targetName}! 🎉`);
        setSuggestions((prev) => prev.filter((s) => s.clerkId !== targetClerkId));
        setConnections((prev) => [
          {
            ...newConn,
            targetUser: { clerkId: targetClerkId, name: targetName }
          },
          ...prev
        ]);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to send request');
      }
    } catch (err) {
      toast.error('Error sending connection request');
    } finally {
      setIsConnecting(null);
    }
  };

  const handleUnfriendConfirm = async () => {
    const { connectionId, targetName } = unfriendConfirm;
    if (!connectionId) return;
    try {
      const res = await fetch(`${API_BASE}/api/connections/${connectionId}`, { method: 'DELETE' });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c._id !== connectionId));
        toast.success(`${targetName} removed from network.`);
      } else {
        toast.error('Failed to remove connection.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  };

  const handleUnfriend = (connectionId, targetName) => {
    setUnfriendConfirm({ isOpen: true, connectionId, targetName });
  };

  // Categorize connections
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const incomingRequests = connections.filter(
    (c) => c.status === 'pending' && c.recipientClerkId === user?.id
  );
  const outgoingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requesterClerkId === user?.id
  );

  // Filtered lists by search term
  const filteredConnections = acceptedConnections.filter(
    (c) =>
      c.targetUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetUser?.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetUser?.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDiscover = suggestions.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.headline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Header Banner */}
      <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">My Network</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your connections, pending invitations, and discover new peers across colleges.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto">
          <div className="flex-1 sm:flex-none bg-primary/10 border border-primary/20 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-center">
            <span className="text-lg sm:text-xl font-bold text-primary block leading-tight">
              {acceptedConnections.length}
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Connections</span>
          </div>

          {incomingRequests.length > 0 && (
            <div className="flex-1 sm:flex-none bg-amber-500/10 border border-amber-500/20 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-center animate-pulse">
              <span className="text-lg sm:text-xl font-bold text-amber-500 block leading-tight">
                {incomingRequests.length}
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Pending Requests
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'connections'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" /> Connections ({acceptedConnections.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 relative ${
              activeTab === 'pending'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Clock className="w-4 h-4" /> Pending Requests ({incomingRequests.length + outgoingRequests.length})
            {incomingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'discover'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Discover People
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search network..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ACCEPTED CONNECTIONS */}
          {activeTab === 'connections' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {filteredConnections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConnections.map((conn) => {
                    const target = conn.targetUser;
                    return (
                      <div
                        key={conn._id}
                        className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <Link to={`/dashboard/student/${target?.clerkId}`}>
                            <img
                              src={target?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${target?.name}`}
                              alt={target?.name}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/dashboard/student/${target?.clerkId}`}
                              className="font-bold text-base text-foreground hover:text-primary transition-colors block truncate"
                            >
                              {target?.name}
                            </Link>
                            <p className="text-xs text-primary font-medium capitalize mt-0.5">
                              {target?.role || 'Student'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 shrink-0" /> {target?.course}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Message & Video Call */}
                        <div className="flex gap-2 pt-2 border-t border-border/30">
                          <button
                            onClick={() => navigate(`/dashboard/messages?userId=${target?.clerkId}`)}
                            className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Message
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent('initiate_call', {
                                  detail: {
                                    targetPartner: {
                                      clerkId: target?.clerkId,
                                      name: target?.name,
                                      image: target?.image
                                    },
                                    type: 'video'
                                  }
                                })
                              );
                            }}
                            className="bg-muted hover:bg-primary/20 text-foreground hover:text-primary p-2 rounded-xl text-xs font-semibold transition-colors"
                            title="Video Call"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUnfriend(conn._id, target?.name)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-xl text-xs font-semibold transition-colors"
                            title="Remove Connection"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border/50 rounded-2xl p-6">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h3 className="font-bold text-foreground text-lg">No connections found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Connect with students, mentors, and alumni across colleges to grow your network!
                  </p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Discover People
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: PENDING REQUESTS (INCOMING & OUTGOING) */}
          {activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Incoming Requests Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <span>Received Invitations</span>
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {incomingRequests.length}
                  </span>
                </h3>

                {incomingRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incomingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={req.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.targetUser?.name}`}
                            alt={req.targetUser?.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">{req.targetUser?.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{req.targetUser?.course || 'Member'}</p>
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1 italic">
                              "{req.message || 'Wants to connect with you.'}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUpdateStatus(req._id, 'declined')}
                            className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req._id, 'accepted')}
                            className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-card/50 border border-border/40 rounded-2xl p-4 text-muted-foreground text-sm">
                    No pending invitations.
                  </div>
                )}
              </div>

              {/* Outgoing Pending Requests Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <span>Sent Invitations</span>
                  <span className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {outgoingRequests.length}
                  </span>
                </h3>

                {outgoingRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={req.targetUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.targetUser?.name}`}
                            alt={req.targetUser?.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">{req.targetUser?.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{req.targetUser?.course || 'Member'}</p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> Request Sent ⏳
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-card/50 border border-border/40 rounded-2xl p-4 text-muted-foreground text-sm">
                    No sent requests pending.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: DISCOVER PEOPLE */}
          {activeTab === 'discover' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {filteredDiscover.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDiscover.map((item) => (
                    <div
                      key={item.clerkId}
                      className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-primary/40 transition-all hover:shadow-md"
                    >
                      <Link to={`/dashboard/student/${item.clerkId}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
                        />
                      </Link>

                      <div className="space-y-1 w-full">
                        <Link
                          to={`/dashboard/student/${item.clerkId}`}
                          className="font-bold text-base text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs font-semibold text-primary capitalize bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
                          {item.role}
                        </span>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                          {item.headline}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSendRequest(item.clerkId, item.name)}
                        disabled={isConnecting === item.clerkId}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {isConnecting === item.clerkId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" /> Connect
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border/50 rounded-2xl p-6 text-muted-foreground">
                  No suggested people found.
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}

      <ConfirmModal
        isOpen={unfriendConfirm.isOpen}
        onClose={() => setUnfriendConfirm({ isOpen: false, connectionId: null, targetName: '' })}
        onConfirm={handleUnfriendConfirm}
        title="Remove Connection"
        message={`Are you sure you want to remove ${unfriendConfirm.targetName} from your network?`}
        confirmText="Remove"
        isDestructive={true}
      />
    </div>
  );
};

export default MyNetwork;
