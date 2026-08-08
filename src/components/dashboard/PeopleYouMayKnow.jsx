import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PeopleYouMayKnow = () => {
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState([]);
  const [connectionStates, setConnectionStates] = useState({});
  const [isConnecting, setIsConnecting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/connections/suggestions/${user.id}`);
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

    fetchSuggestions();
  }, [user]);

  const handleConnect = async (targetClerkId, targetName) => {
    if (!user) return;
    setIsConnecting(targetClerkId);
    try {
      const res = await fetch('/api/connections', {
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

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">People You May Know</h3>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Suggested for you</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.slice(0, 6).map((item) => {
          const status = connectionStates[item.clerkId] || 'none';

          return (
            <div
              key={item.clerkId}
              className="bg-background/60 border border-border/40 rounded-xl p-4 flex flex-col items-center text-center space-y-3 hover:border-primary/30 transition-all hover:shadow-md"
            >
              <Link to={`/dashboard/student/${item.clerkId}`}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 shadow-sm"
                />
              </Link>

              <div className="flex-1 w-full space-y-1">
                <Link
                  to={`/dashboard/student/${item.clerkId}`}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-primary font-medium capitalize">{item.role}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{item.headline}</p>
              </div>

              <div className="w-full pt-1">
                {status === 'pending' ? (
                  <button
                    disabled
                    className="w-full text-xs font-semibold text-amber-500 border border-amber-500/30 bg-amber-500/10 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Clock className="w-3.5 h-3.5" /> Request Sent ⏳
                  </button>
                ) : status === 'accepted' ? (
                  <button
                    disabled
                    className="w-full text-xs font-semibold text-green-500 border border-green-500/30 bg-green-500/10 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(item.clerkId, item.name)}
                    disabled={isConnecting === item.clerkId}
                    className="w-full text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeopleYouMayKnow;
