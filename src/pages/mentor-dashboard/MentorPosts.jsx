import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Briefcase, Calendar as CalendarIcon, FileText } from 'lucide-react'

const MentorPosts = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: 'Rohit Sharma',
        role: 'Senior Software Engineer at Amazon',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      },
      time: '2 hours ago',
      content: 'Just published a new guide on cracking system design interviews. Happy to review resumes of any of my mentees preparing for SDE roles this season! Let me know in the comments below. 👇',
      likes: 124,
      comments: 18,
    }
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Create Post */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex gap-4 mb-4">
          <img 
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" 
            alt="Profile" 
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
          <button className="flex-1 text-left bg-background border border-border/50 rounded-full px-4 text-muted-foreground hover:bg-muted/50 transition-colors">
            Share something with your mentees...
          </button>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1 sm:gap-2">
            <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-blue-500 font-medium text-sm">
              <ImageIcon className="w-5 h-5" /> <span className="hidden sm:inline">Media</span>
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-purple-500 font-medium text-sm">
              <Briefcase className="w-5 h-5" /> <span className="hidden sm:inline">Add Job</span>
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-orange-500 font-medium text-sm">
              <CalendarIcon className="w-5 h-5" /> <span className="hidden sm:inline">Create Event</span>
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors text-green-500 font-medium text-sm">
              <FileText className="w-5 h-5" /> <span className="hidden sm:inline">Upload Resource</span>
            </button>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            Post
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Your Recent Posts</h2>

      {/* Feed Posts */}
      <div className="space-y-6">
        {posts.map(post => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3">
                  <img src={post.author.image} alt={post.author.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{post.author.name}</h3>
                    <p className="text-xs text-muted-foreground">{post.author.role}</p>
                    <p className="text-[10px] text-muted-foreground">{post.time}</p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-4">
                {post.content}
              </p>
            </div>
            
            <div className="px-4 sm:px-5 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3 mb-2">
                <div className="flex items-center gap-1">
                  <span className="bg-blue-500 text-white rounded-full p-0.5"><Heart className="w-3 h-3 fill-current" /></span>
                  <span>{post.likes}</span>
                </div>
                <span>{post.comments} comments</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-6 pt-1">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                  <Heart className="w-5 h-5" /> Like
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                  <MessageCircle className="w-5 h-5" /> Comment
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted py-2 px-3 rounded-lg transition-colors font-medium text-sm">
                  <Share2 className="w-5 h-5" /> Share
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  )
}

export default MentorPosts

