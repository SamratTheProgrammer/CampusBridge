import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Forward, Check, FileText, Image, Video, Mic, Share2, CornerUpRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';
import ModalPortal from './ModalPortal';

export const ForwardMessageModal = ({ 
  isOpen, 
  onClose, 
  messages = [], 
  currentUserId, 
  initialContacts = [],
  onForwardInitiated,
  onForwardSuccess 
}) => {
  const [contacts, setContacts] = useState(initialContacts || []);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesList = (Array.isArray(messages) ? messages : (messages ? [messages] : []))
    .filter(m => !m.isDeleted && !(m.type === 'share' && m.share?.isDeleted));

  useEffect(() => {
    if (isOpen) {
      setSelectedContactIds([]);
      setSearchQuery('');
      if (initialContacts && initialContacts.length > 0) {
        setContacts(initialContacts);
        setIsLoadingContacts(false);
      } else if (currentUserId) {
        fetchContacts();
      }
    }
  }, [isOpen, currentUserId, initialContacts]);

  const fetchContacts = async () => {
    if (!initialContacts || initialContacts.length === 0) {
      setIsLoadingContacts(true);
    }
    try {
      const res = await fetch(`${API_BASE}/api/messages/conversations/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching contacts for forward:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  if (!isOpen || messagesList.length === 0) return null;

  const toggleSelectContact = (clerkId) => {
    setSelectedContactIds(prev => {
      if (prev.includes(clerkId)) {
        return prev.filter(id => id !== clerkId);
      }
      return [...prev, clerkId];
    });
  };

  const filteredContacts = contacts.filter(c => {
    const nameMatch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = c.role?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || roleMatch;
  });

  const handleForward = () => {
    if (selectedContactIds.length === 0) {
      toast.error('Select at least one contact to forward to');
      return;
    }
    if (messagesList.length === 0) {
      toast.error('No messages selected to forward');
      return;
    }

    const selectedIds = [...selectedContactIds];
    const msgs = [...messagesList];
    const selectedContactsList = contacts.filter(c => selectedIds.includes(c.clerkId || c.id));

    // Instantly close modal (WhatsApp style: no waiting in forward modal!)
    onClose();

    if (onForwardInitiated) {
      onForwardInitiated({
        recipientClerkIds: selectedIds,
        messages: msgs,
        targetContacts: selectedContactsList
      });
    }
  };

  const renderMessagePreviewSnippet = () => {
    if (messagesList.length === 0) return null;
    if (messagesList.length === 1) {
      const msg = messagesList[0];
      let icon = <CornerUpRight className="w-3.5 h-3.5 text-primary shrink-0" />;
      let desc = msg.text || 'Message';

      if (msg.type === 'image' || msg.attachment?.type === 'image') {
        icon = <Image className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
        desc = msg.text ? `Photo: ${msg.text}` : 'Photo';
      } else if (msg.type === 'video' || msg.attachment?.type === 'video') {
        icon = <Video className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
        desc = msg.text ? `Video: ${msg.text}` : 'Video';
      } else if (msg.type === 'audio' || msg.attachment?.type === 'audio') {
        icon = <Mic className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
        desc = 'Voice Message';
      } else if (msg.type === 'share' && msg.share) {
        icon = <Share2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
        desc = `${msg.share.type ? msg.share.type.toUpperCase() : 'POST'}: ${msg.share.title || msg.share.authorName || 'Shared item'}`;
      } else if (msg.attachment) {
        icon = <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />;
        desc = msg.attachment.name || 'Document';
      }

      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-xl text-xs text-foreground border border-border/40 truncate">
          {icon}
          <span className="truncate">{desc}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-xl text-xs text-foreground border border-border/40">
        <Forward className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-semibold">{messagesList.length} messages selected</span>
      </div>
    );
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          className="bg-card border border-border/70 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Forward className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Forward {messagesList.length > 1 ? `${messagesList.length} Messages` : 'Message'}
                </h3>
                <p className="text-xs text-muted-foreground">Select contacts to forward to</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message Preview Strip */}
          <div className="px-4 pt-3 shrink-0">
            {renderMessagePreviewSnippet()}
          </div>

          {/* Search Box */}
          <div className="p-4 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border/50 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            {isLoadingContacts ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Loading contacts...</span>
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(contact => {
                const isSelected = selectedContactIds.includes(contact.clerkId);
                return (
                  <div
                    key={contact.clerkId}
                    onClick={() => toggleSelectContact(contact.clerkId)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {contact.image ? (
                          <img src={contact.image} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
                            {(contact.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        {contact.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.role || 'Member'}</p>
                      </div>
                    </div>

                    {/* WhatsApp-Style Checkbox */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border/80 bg-background'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-muted-foreground text-xs">
                {searchQuery ? 'No contacts match your search.' : 'No chat conversations found.'}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 border-t border-border/40 bg-card flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">
              {selectedContactIds.length > 0 ? (
                <span className="font-semibold text-foreground">
                  {selectedContactIds.length} contact{selectedContactIds.length > 1 ? 's' : ''} selected
                </span>
              ) : (
                'Select recipients'
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedContactIds.length === 0}
                onClick={handleForward}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-95 cursor-pointer"
              >
                <Forward className="w-3.5 h-3.5" />
                <span>Send {selectedContactIds.length > 0 ? `(${selectedContactIds.length})` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ForwardMessageModal;
