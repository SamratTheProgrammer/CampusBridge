import React from 'react'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const stories = [
  {
    name: 'Michael Chang',
    role: 'Software Engineer @ Google',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    quote: "CampusBridge changed my life. I connected with an alumnus working at Google who reviewed my resume and did mock interviews with me. Three months later, I got the offer!",
    before: 'CS Student',
    after: 'Placed at Google'
  },
  {
    name: 'Jessica Taylor',
    role: 'Product Designer @ Meta',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    quote: "Finding a mentor who actually understood the design industry was tough. Through this platform, I found someone who helped me revamp my portfolio entirely.",
    before: 'Self-taught Designer',
    after: 'Mentored by Alumni'
  },
  {
    name: 'Ahmad Rahman',
    role: 'Data Analyst @ Amazon',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    quote: "The job board here is incredible. These aren't just regular postings; they are roles shared by alumni who want to hire from their alma mater. It gave me a huge advantage.",
    before: 'Recent Grad',
    after: 'Fast-tracked Career'
  }
]

const SuccessStories = () => {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Success Stories</h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Hear from students who transformed their careers through our platform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <motion.div
              key={story.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card border rounded-2xl p-8 relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              
              <div className="flex items-center gap-1 text-yellow-500 mb-6">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
              </div>

              <p className="text-muted-foreground mb-8 relative z-10 italic">"{story.quote}"</p>

              <div className="flex items-center justify-between border-t pt-6 mb-6">
                <div className="text-sm">
                  <p className="text-muted-foreground line-through decoration-destructive/50">{story.before}</p>
                  <p className="font-bold text-primary flex items-center gap-2">
                    {story.after}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <img 
                  src={story.image} 
                  alt={story.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-foreground">{story.name}</h4>
                  <p className="text-xs text-muted-foreground">{story.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SuccessStories
