import React from 'react'
import { Play } from 'lucide-react'
import { motion } from 'framer-motion'

const WatchDemo = () => {
  return (
    <section className="py-24 overflow-hidden relative bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:w-1/2"
          >
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-xs tracking-wider uppercase">
              Watch Demo
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground leading-tight">
              See CampusBridge <br/> in Action
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Discover how our platform bridges the gap between ambitious students and experienced alumni. In this quick demo, we'll walk you through the core features of CampusBridge:
            </p>
            
            <ul className="space-y-4 mb-8">
              {[
                "Finding and connecting with industry mentors",
                "Discovering exclusive job and internship opportunities",
                "Joining vibrant student and alumni communities"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Video Placeholder */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-1/2 w-full"
          >
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/50 bg-background shadow-2xl group cursor-pointer">
              {/* Replace the content below with an iframe when adding the YouTube video */}
              
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-background to-background"></div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor" />
                </div>
                <span className="font-semibold text-foreground">Click to watch video</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default WatchDemo
