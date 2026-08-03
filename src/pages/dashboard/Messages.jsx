import React, { useState } from 'react'
import { Search, Phone, Video, MoreVertical, Send, Image as ImageIcon, Smile, Paperclip } from 'lucide-react'

const Messages = () => {
  const contacts = [
    { id: 1, name: 'Arjun Mehta', message: 'Hey, how are you?', time: '10:30 AM', active: true, unread: 0, image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=150&q=80' },
    { id: 2, name: 'Sneha Roy', message: 'Thanks for connecting!', time: 'Yesterday', active: false, unread: 2, image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&w=150&q=80' },
    { id: 3, name: 'Rohit Sharma', message: 'Can we schedule a call?', time: '2 May', active: false, unread: 0, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&q=80' },
    { id: 4, name: 'Karan Verma', message: 'Sure, let\'s do it tomorrow.', time: '1 May', active: false, unread: 0, image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&w=150&q=80' },
    { id: 5, name: 'Priya Singh', message: 'Shared an event with you.', time: '28 Apr', active: false, unread: 0, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80' }
  ]

  const chatHistory = [
    { id: 1, sender: 'Arjun', text: 'Hey Ananya, how are you?', time: '10:30 AM', isMe: false },
    { id: 2, sender: 'Me', text: "I'm good! Thank you so much.", time: '10:31 AM', isMe: true },
    { id: 3, sender: 'Arjun', text: 'I saw your profile. You have great projects!', time: '10:32 AM', isMe: false },
    { id: 4, sender: 'Me', text: "Thank you! I'd love to learn from your experience.", time: '10:33 AM', isMe: true },
    { id: 5, sender: 'Arjun', text: "Let's schedule a call this weekend.", time: '10:34 AM', isMe: false },
    { id: 6, sender: 'Me', text: 'Sure! Saturday works for me.', time: '10:35 AM', isMe: true }
  ]

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Left Sidebar (Contacts) */}
      <div className="w-full sm:w-80 border-r border-border/40 flex flex-col h-full bg-card shrink-0">
        <div className="p-4 border-b border-border/40">
          <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search messages..."
              className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {contacts.map(contact => (
            <div 
              key={contact.id} 
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/40 last:border-b-0
                ${contact.active ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50 border-l-2 border-l-transparent'}`}
            >
              <img src={contact.image} alt={contact.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`font-semibold text-sm truncate ${contact.unread > 0 ? 'text-foreground' : 'text-foreground/80'}`}>{contact.name}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{contact.time}</span>
                </div>
                <p className={`text-xs truncate ${contact.unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{contact.message}</p>
              </div>
              {contact.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                  {contact.unread}
                </div>
              )}
            </div>
          ))}
          <div className="p-4 text-center">
            <button className="text-sm font-medium text-primary hover:underline">View All Messages</button>
          </div>
        </div>
      </div>

      {/* Right Content (Chat Area) */}
      <div className="hidden sm:flex flex-1 flex-col h-full bg-background relative">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <img src={contacts[0].image} alt={contacts[0].name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h3 className="font-bold text-foreground text-sm">{contacts[0].name}</h3>
              <p className="text-xs text-green-500 font-medium">Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"><Phone className="w-5 h-5" /></button>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"><Video className="w-5 h-5" /></button>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-center mb-6">
            <span className="text-xs font-medium text-muted-foreground bg-card border border-border/40 px-3 py-1 rounded-full">Today</span>
          </div>

          {chatHistory.map(msg => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${msg.isMe ? 'order-1' : 'order-2'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm
                  ${msg.isMe 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-card border border-border/40 text-foreground rounded-bl-none'}`}
                >
                  {msg.text}
                </div>
                <div className={`text-[10px] text-muted-foreground mt-1 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-card border-t border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"><Paperclip className="w-5 h-5" /></button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Type a message..."
                className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-background transition-colors"><Smile className="w-4 h-4" /></button>
            </div>
            <button className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages
