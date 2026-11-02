import React, { useState, useEffect } from 'react';
import { VolumeX, Loader2, UserX, ExternalLink } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';
import defaultPP from '../../assets/default_pp.png';
import { getMutedAuthors, removeMutedAuthor } from '../../utils/postInteractions';

const MutedAccountsManager = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [mutedUsers, setMutedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unmutingId, setUnmutingId] = useState(null);

  const fetchMutedUsers = async () => {
    if (!user?.id) return;
    try {
      const localIds = getMutedAuthors();
      if (localIds.length === 0) {
        setMutedUsers([]);
        setIsLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/posts/muted-authors?userClerkId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.mutedAuthors)) {
          setMutedUsers(data.mutedAuthors);
        }
      }
    } catch (err) {
      console.error('Failed to fetch muted users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMutedUsers();

    const handleSync = () => fetchMutedUsers();
    window.addEventListener('campusbridge_muted_authors_changed', handleSync);
    return () => window.removeEventListener('campusbridge_muted_authors_changed', handleSync);
  }, [user?.id]);

  const handleUnmute = async (targetClerkId, name) => {
    setUnmutingId(targetClerkId);
    try {
      await removeMutedAuthor(targetClerkId, user?.id);
      setMutedUsers(prev => prev.filter(u => u.clerkId !== targetClerkId));
      toast.success(`Unmuted ${name || 'user'}`);
    } catch (e) {
      toast.error('Failed to unmute user');
    } finally {
      setUnmutingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
      <div className="flex items-start gap-4">
        <VolumeX className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="w-full">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground">Muted Accounts</h4>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {mutedUsers.length} muted
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Posts from these accounts are hidden from your feed. You can unmute them anytime here or directly on their profile.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : mutedUsers.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/40 text-xs text-muted-foreground">
              <UserX className="w-4 h-4 text-muted-foreground" />
              <span>You haven't muted any accounts yet.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/30 rounded-lg border border-border/40 bg-background overflow-hidden max-h-60 overflow-y-auto">
              {mutedUsers.map((mu) => (
                <div key={mu.clerkId} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/30 transition-colors">
                  <div 
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/profile/${mu.username || mu.clerkId}`)}
                  >
                    <img
                      src={mu.image || defaultPP}
                      alt={mu.name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultPP; }}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors flex items-center gap-1">
                        {mu.name}
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{mu.username || mu.clerkId.slice(0, 8)} • <span className="capitalize">{mu.role || 'user'}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnmute(mu.clerkId, mu.name)}
                    disabled={unmutingId === mu.clerkId}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {unmutingId === mu.clerkId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Unmute'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MutedAccountsManager;

