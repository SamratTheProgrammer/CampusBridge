import React, { useState } from 'react'
import { Search, Send, Image as ImageIcon, Paperclip, MoreVertical, CheckCircle2, FileText, Phone, Video } from 'lucide-react'

const MOCK_CONTACTS = [
  { id: 1, name: 'Ananya Sharma', role: 'B.Tech CS Student', lastMessage: 'Thank you for the feedback!', time: '10:42 AM', unread: 2, image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80', online: true },
  { id: 2, name: 'Rahul Verma', role: 'MCA Student', lastMessage: 'Can we schedule a call tomorrow?', time: 'Yesterday', unread: 0, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80', online: false },
  { id: 3, name: 'Neha Gupta', role: 'B.E. IT Student', lastMessage: 'I updated my resume as you suggested.', time: 'Monday', unread: 0, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80', online: true },
]

const MOCK_CHAT = [
  { id: 1, sender: 'them', text: 'Hi Rohit, could you please review the latest version of my resume?', time: '10:30 AM' },
  { id: 2, sender: 'me', text: 'Sure Ananya. Drop the PDF here and I will take a look this evening.', time: '10:35 AM' },
  { id: 3, sender: 'them', text: 'Awesome, here it is!', time: '10:40 AM', isAttachment: true, attachmentName: 'Ananya_Resume_v2.pdf' },
  { id: 4, sender: 'them', text: 'Thank you for the feedback!', time: '10:42 AM' },
]

const MentorMessages = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeContact, setActiveContact] = useState(MOCK_CONTACTS[0])
  const [message, setMessage] = useState('')

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    // Mock sending message
    setMessage('')
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm max-w-7xl mx-auto">
      
      {/* Left Sidebar - Contact List */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-border/50 bg-background/50">
        <div className="p-4 border-b border-border/50">
          <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none divide-y divide-border/40">
          {MOCK_CONTACTS.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`p-4 cursor-pointer transition-colors flex gap-3 items-center ${activeContact.id === contact.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
            >
              <div className="relative shrink-0">
                <img src={contact.image} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="font-semibold text-sm text-foreground truncate pr-2">{contact.name}</h4>
                  <span className="text-[10px] text-muted-foreground shrink-0">{contact.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground truncate pr-2">{contact.lastMessage}</p>
                  {contact.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content - Chat Window */}
      <div className="hidden md:flex flex-1 flex-col bg-background/20 relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-border/50 px-6 flex items-center justify-between bg-card/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={activeContact.image} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover" />
              {activeContact.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{activeContact.name}</h3>
              <p className="text-[10px] text-muted-foreground">{activeContact.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <button className="hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"><Phone className="w-4 h-4" /></button>
            <button className="hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"><Video className="w-4 h-4" /></button>
            <button className="hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"><Search className="w-4 h-4" /></button>
            <button className="hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"><MoreVertical className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-center text-xs text-muted-foreground mb-6">
            Today
          </div>
          {MOCK_CHAT.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[70%] ${msg.sender === 'me' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              {msg.isAttachment ? (
                <div className={`p-3 rounded-2xl border flex items-center gap-3 ${msg.sender === 'me' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border/50 text-foreground'}`}>
                  <div className="p-2 bg-background/20 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium">{msg.attachmentName}</div>
                </div>
              ) : (
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted border border-border/50 text-foreground rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              )}
              <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                {msg.time} {msg.sender === 'me' && <CheckCircle2 className="w-3 h-3 text-primary" />}
              </span>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-card border-t border-border/50 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
            <button type="button" className="p-2.5 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <button type="button" className="p-2.5 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 bg-muted border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
            <button 
              type="submit" 
              disabled={!message.trim()}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
      
    </div>
  )
}

export default MentorMessages

