import React, { useState } from 'react'
import { Play } from 'lucide-react'
import { motion } from 'framer-motion'

const WatchDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false)
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

          {/* Video Player */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-1/2 w-full"
          >
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/50 bg-black shadow-2xl group/vid">
              {isPlaying ? (
                <div className="relative w-full h-full">
                  <iframe
                    className="w-full h-full border-0"
                    src="https://www.youtube-nocookie.com/embed/9QI528WiZWI?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&controls=1"
                    title="CampusBridge Platform Walkthrough"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  {/* Invisible overlay — blocks mouse from iframe so YouTube hides controls.
                      On hover: pointer-events-none lets mouse through → YouTube shows controls. */}
                  <div className="absolute inset-0 z-10 pointer-events-auto group-hover/vid:pointer-events-none transition-opacity duration-300" />
                </div>
              ) : (
                <div 
                  onClick={() => setIsPlaying(true)}
                  className="relative w-full h-full cursor-pointer overflow-hidden"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsPlaying(true)}
                  title="Play CampusBridge Demo Video"
                >
                  <img
                    src="https://img.youtube.com/vi/9QI528WiZWI/maxresdefault.jpg"
                    alt="CampusBridge Demo Video Thumbnail"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/vid:scale-105"
                    onError={(e) => {
                      e.target.src = "https://img.youtube.com/vi/9QI528WiZWI/hqdefault.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 group-hover/vid:bg-black/20 transition-colors duration-300" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover/vid:scale-105">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/40 mb-3 transition-transform duration-300 group-hover/vid:scale-110">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor" />
                    </div>
                    <span className="font-semibold text-white text-sm sm:text-base tracking-wide drop-shadow-md">
                      Click to watch video
                    </span>
                  </div>

                  {/* Corner indicator */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    YouTube
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default WatchDemo
