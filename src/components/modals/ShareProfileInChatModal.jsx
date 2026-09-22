import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, User, Send, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import ModalPortal from './ModalPortal';
import API_BASE from '../../utils/api';
import toast from 'react-hot-toast';
import { formatRoleSubtitle } from '../../utils/textFormatters';

const ShareProfileInChatModal = ({ isOpen, onClose, currentUser, activeContact, onShared }) => {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sharingUserId, setSharingUserId] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchContacts();
    }
  }, [isOpen, currentUser]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversations/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out activeContact and current user
        setContacts(data.filter(c => c.clerkId !== activeContact?.clerkId && c.clerkId !== currentUser?.id));
      }
    } catch (err) {
      console.error('Error fetching contacts to share profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareProfile = async (targetUser) => {
    if (!activeContact || !currentUser) return;
    const targetId = targetUser.clerkId || targetUser.username || targetUser.id;
    if (!targetId) {
      toast.error('User information missing');
      return;
    }

    setSharingUserId(targetId);
    try {
      const res = await fetch(`${API_BASE}/api/messages/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderClerkId: currentUser.id,
          recipientIds: [activeContact.clerkId],
          shareType: 'profile',
          itemId: targetId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Shared ${targetUser.name || 'profile'} in chat!`);
        if (onShared) onShared(data.messages?.[0]);
        onClose();
      } else {
        toast.error(data.message || 'Failed to share profile.');
      }
    } catch (err) {
      console.error('Error sharing profile in chat:', err);
      toast.error('Error sharing profile.');
    } finally {
      setSharingUserId(null);
    }
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.headline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myProfileData = {
    clerkId: currentUser.id,
    id: currentUser.id,
    name: currentUser.fullName || currentUser.firstName || 'My Profile',
    headline: currentUser.unsafeMetadata?.headline || (currentUser.publicMetadata?.role === 'mentor' ? 'Mentor' : 'Student'),
    image: currentUser.imageUrl,
    role: currentUser.publicMetadata?.role || 'student'
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Share Profile in Chat</h2>
                <p className="text-xs text-muted-foreground">Send a profile card to {activeContact?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* Share My Own Profile Section */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-primary/30">
                  {myProfileData.image ? (
                    <img src={myProfileData.image} alt={myProfileData.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                      {myProfileData.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm text-foreground truncate">{myProfileData.name}</p>
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-semibold">You</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{myProfileData.headline}</p>
                </div>
              </div>

              <button
                onClick={() => handleShareProfile(myProfileData)}
                disabled={sharingUserId === myProfileData.clerkId}
                className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {sharingUserId === myProfileData.clerkId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Share Mine</span>
              </button>
            </div>

            {/* Search Other Contacts */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                Or Share Another Contact
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/60 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="space-y-2 py-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-muted shrink-0"></div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-muted rounded w-1/2"></div>
                        <div className="h-2.5 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  {searchQuery ? 'No contacts match your search.' : 'No other contacts found to share.'}
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id || contact.clerkId}
                    className="flex items-center justify-between gap-3 p-2 hover:bg-muted/60 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0 border border-border/50">
                        {contact.image ? (
                          <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            {(contact.name || 'U').charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{contact.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{formatRoleSubtitle(contact.headline, contact.role)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleShareProfile(contact)}
                      disabled={sharingUserId === contact.clerkId}
                      className="px-2.5 py-1.5 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {sharingUserId === contact.clerkId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Share</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ShareProfileInChatModal;
