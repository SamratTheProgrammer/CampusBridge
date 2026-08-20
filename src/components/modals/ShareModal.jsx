import React, { useState, useEffect } from 'react';
import { X, Copy, Send, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';

const ShareModal = ({ isOpen, onClose, shareUrl, shareType, itemId }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'chat'
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'chat' && user) {
      fetchContacts();
    }
  }, [isOpen, activeTab, user]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversations/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Error fetching contacts for share:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleContact = (clerkId) => {
    setSelectedContactIds(prev => 
      prev.includes(clerkId) ? prev.filter(id => id !== clerkId) : [...prev, clerkId]
    );
  };

  const handleSend = async () => {
    if (selectedContactIds.length === 0) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderClerkId: user.id,
          recipientIds: selectedContactIds,
          shareType,
          itemId
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Shared with ${selectedContactIds.length} friend${selectedContactIds.length > 1 ? 's' : ''}!`);
        onClose();
        setSelectedContactIds([]);
        setActiveTab('link');
      } else {
        toast.error('Failed to share.');
      }
    } catch (err) {
      toast.error('Error sharing.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-bold">Share {shareType.charAt(0).toUpperCase() + shareType.slice(1)}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-border/50">
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'link' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('link')}
          >
            Copy Link
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('chat')}
          >
            Send in Chat
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'link' ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                <p className="flex-1 text-sm truncate text-muted-foreground select-all">{shareUrl}</p>
                <button 
                  onClick={handleCopyLink}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shrink-0"
                >
                  {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="h-60 overflow-y-auto space-y-1 pr-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No friends found.</p>
                ) : (
                  filteredContacts.map(contact => {
                    const isSelected = selectedContactIds.includes(contact.clerkId);
                    return (
                      <div 
                        key={contact.id} 
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted'}`}
                        onClick={() => handleToggleContact(contact.clerkId)}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                          {contact.image ? (
                            <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                              {contact.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{contact.headline || contact.role}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedContactIds.length > 0 && (
                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Separately
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
