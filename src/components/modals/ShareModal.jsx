import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Search, Loader2, Share2, Link as LinkIcon, Check } from 'lucide-react';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';
import { formatRoleSubtitle } from '../../utils/textFormatters';
import ModalPortal from './ModalPortal';

const ShareModal = ({ isOpen, onClose, shareUrl, shareType = 'item', itemId }) => {
  const { user } = useUser();
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchContacts();
    }
  }, [isOpen, user]);

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

  const trackShare = async () => {
    if (shareType === 'post' && itemId) {
      try {
        await fetch(`${API_BASE}/api/posts/${itemId}/share`, { method: 'POST' });
      } catch (e) {
        console.error('Error tracking share:', e);
      }
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
    } else {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    trackShare();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this ${shareType} on CampusBridge`,
          url: shareUrl,
        });
        trackShare();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing natively:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check this out on CampusBridge: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    trackShare();
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    trackShare();
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
        setSelectedContactIds([]);
        onClose();
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
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-card border border-border/70 rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col max-h-[85vh] sm:max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
            <h2 className="text-base font-bold text-foreground">
              Share {shareType.charAt(0).toUpperCase() + shareType.slice(1)}
            </h2>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Friends */}
          <div className="px-5 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input 
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted/70 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>
          </div>

          {/* Contacts / Friends List */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-1 min-h-[170px] max-h-[280px]">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-muted rounded w-1/2"></div>
                      <div className="h-2.5 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="w-5 h-5 rounded-full border border-border bg-muted/50"></div>
                  </div>
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm font-medium">No conversations found.</p>
                <p className="text-xs mt-1 text-muted-foreground/80">You can still share via Copy Link or other apps below!</p>
              </div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = selectedContactIds.includes(contact.clerkId);
                return (
                  <div 
                    key={contact.conversationId || contact.clerkId} 
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/70'}`}
                    onClick={() => handleToggleContact(contact.clerkId)}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                      {contact.image ? (
                        <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                          {contact.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{formatRoleSubtitle(contact.headline, contact.role)}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send in Chat Button (Only when friends are selected) */}
          {selectedContactIds.length > 0 && (
            <div className="px-5 pt-2 pb-2 shrink-0 animate-in fade-in duration-150">
              <button 
                onClick={handleSend}
                disabled={isSending}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer text-sm active:scale-98"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send to {selectedContactIds.length} friend{selectedContactIds.length > 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Instagram-style Bottom Quick Share Actions Row */}
          <div className="px-5 pt-3 pb-5 border-t border-border/50 bg-muted/20 shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
              Share to
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xs ${isCopied ? 'bg-emerald-500 text-white' : 'bg-card border border-border/80 hover:bg-muted text-foreground group-hover:scale-105'}`}>
                  {isCopied ? <CheckCircle2 className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </div>
                <span className="text-[11px] font-medium text-foreground/80 group-hover:text-primary transition-colors">
                  {isCopied ? 'Copied!' : 'Copy link'}
                </span>
              </button>

              {/* Native Share / More Apps */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-card border border-border/80 hover:bg-muted text-foreground flex items-center justify-center transition-all shadow-xs group-hover:scale-105">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-foreground/80 group-hover:text-primary transition-colors">
                  Share via...
                </span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-600 dark:text-green-400 flex items-center justify-center transition-all shadow-xs group-hover:scale-105">
                  <FaWhatsapp className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-foreground/80 group-hover:text-green-500 transition-colors">
                  WhatsApp
                </span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebookShare}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all shadow-xs group-hover:scale-105">
                  <FaFacebook className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-foreground/80 group-hover:text-blue-500 transition-colors">
                  Facebook
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};

export default ShareModal;
