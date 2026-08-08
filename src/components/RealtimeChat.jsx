import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, MoreVertical, MessageSquare, Loader2, Circle, CheckCheck, Smile } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';

const RealtimeChat = () => {
  const { user } = useUser();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  // Load contacts list for current user
  const fetchContacts = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages/conversations/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        if (data.length > 0 && !activeContact) {
          setActiveContact(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  // Handle active contact selection & room joining
  useEffect(() => {
    if (!user || !activeContact) return;

    const conversationId = activeContact.conversationId;
    setIsLoadingMessages(true);
    setIsOtherTyping(false);

    // Join socket room
    socket.emit('join_room', { conversationId, userId: user.id });
    socket.emit('mark_read', { conversationId, userId: user.id });

    // Fetch conversation messages history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching message history:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchHistory();

    // Socket Event Listeners
    const handleReceiveMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Mark message as read
        if (msg.recipientClerkId === user.id) {
          socket.emit('mark_read', { conversationId, userId: user.id });
        }
      }
      // Update contacts list last message
      fetchContacts();
    };

    const handleUserTyping = ({ userId, isTyping }) => {
      if (userId !== user.id) {
        setIsOtherTyping(isTyping);
      }
    };

    const handleMessagesRead = ({ conversationId: cId }) => {
      if (cId === conversationId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.emit('leave_room', { conversationId });
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [activeContact, user]);

  // Handle Typing Indicator
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!activeContact || !user) return;

    const conversationId = activeContact.conversationId;
    socket.emit('typing', { conversationId, userId: user.id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId, userId: user.id, isTyping: false });
    }, 2000);
  };

  // Handle Send Message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeContact || !user) return;

    const text = inputText.trim();
    setInputText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { conversationId: activeContact.conversationId, userId: user.id, isTyping: false });

    // Emit live message via Socket.io
    socket.emit('send_message', {
      senderClerkId: user.id,
      recipientClerkId: activeContact.clerkId,
      conversationId: activeContact.conversationId,
      text
    });
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden">
      
      {/* Left Contacts Sidebar */}
      <div className="w-full sm:w-80 lg:w-96 border-r border-border/40 flex flex-col h-full bg-card shrink-0">
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Live Messages</h2>
            <span className="flex items-center gap-1.5 text-xs text-green-500 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
              <Circle className="w-2 h-2 fill-current animate-pulse" /> Socket Live
            </span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border/50 rounded-xl focus:outline-none focus:border-primary text-sm text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/30">
          {isLoadingContacts ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const isActive = activeContact?.clerkId === contact.clerkId;
              return (
                <div
                  key={contact.clerkId}
                  onClick={() => setActiveContact(contact)}
                  className={`p-3.5 sm:p-4 cursor-pointer transition-colors flex items-center gap-3.5 relative ${
                    isActive ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted/40 border-l-4 border-l-transparent'
                  }`}
                >
                  <img
                    src={contact.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-border/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`font-semibold text-sm truncate ${contact.unread > 0 ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                        {contact.name}
                      </h4>
                      {contact.lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {formatMessageTime(contact.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${contact.unread > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                      {contact.lastMessage}
                    </p>
                  </div>
                  {contact.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 animate-bounce">
                      {contact.unread}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-medium">No active conversations</p>
              <p className="text-xs text-muted-foreground">Connect with mentors or mentees to start chatting!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      {activeContact ? (
        <div className="flex-1 flex flex-col h-full bg-background relative">
          {/* Header */}
          <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between bg-card/80 backdrop-blur shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={activeContact.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeContact.name}`}
                alt={activeContact.name}
                className="w-10 h-10 rounded-full object-cover border border-border/50"
              />
              <div>
                <h3 className="font-bold text-foreground text-sm">{activeContact.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {isOtherTyping ? (
                    <span className="text-primary font-semibold animate-pulse">typing...</span>
                  ) : (
                    <span>{activeContact.role || 'Member'}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <button className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors" title="Call">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors" title="Video Call">
                <Video className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors" title="More">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isLoadingMessages ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isMe = msg.senderClerkId === user?.id;
                return (
                  <div key={msg._id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] sm:max-w-[65%]`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-xs'
                            : 'bg-card border border-border/50 text-foreground rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isMe && (
                          <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-blue-500' : 'text-muted-foreground/60'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm font-medium">Say hello to {activeContact.name} 👋</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Messages are end-to-end connected via Socket.io</p>
              </div>
            )}

            {/* Typing Animation Indicator */}
            {isOtherTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 px-4 py-2 rounded-2xl rounded-bl-xs text-xs text-muted-foreground flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[11px] font-medium">{activeContact.name} is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-4 bg-card border-t border-border/40 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeContact.name}...`}
                  className="w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition-all pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center bg-background p-8 text-center">
          <div className="space-y-3 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Your Messages</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select a conversation from the sidebar to start chatting live with Socket.io real-time connection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeChat;
