import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const HeroSection = () => {
  return (
    <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left Side: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 text-center lg:text-left"
          >
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Connect with Alumni. <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                Build Your Career.
              </span> <br className="hidden lg:block" />
              Shape Your Future.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Join a thriving network of students and alumni. Share knowledge, find mentorship, explore opportunities, and build a stronger tomorrow together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 flex-wrap mt-2">
              <Link to="/signup" className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 whitespace-nowrap">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/mentorship" className="w-full sm:w-auto px-8 py-3.5 border border-primary/50 text-primary rounded-full font-medium hover:bg-primary/5 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                Find a Mentor
              </Link>
              <button className="w-full sm:w-auto px-8 py-3.5 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 font-medium whitespace-nowrap">
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Right Side: Illustration/Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 relative"
          >
            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl" />

              <div className="relative h-full w-full rounded-2xl overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm p-4 shadow-2xl flex items-center justify-center">
                {/* Fallback abstract representation for 3D illustration */}
                <div className="relative w-full h-full rounded-xl overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                    alt="Students collaborating"
                    className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -left-2 top-1/4 bg-card border border-border/50 rounded-xl p-3.5 shadow-xl flex items-center gap-3 backdrop-blur-md"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Alumni Connected</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="absolute -right-2 bottom-1/4 bg-card border border-border/50 rounded-xl p-3.5 shadow-xl flex items-center gap-3 backdrop-blur-md"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Job Offer Received</p>
                    <p className="text-xs text-muted-foreground">Software Engineer</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default HeroSection
