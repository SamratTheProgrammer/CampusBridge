import React from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

const Newsletter = () => {
  return (
    <section className="py-24 px-4 lg:px-8">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2rem] overflow-hidden"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-90" />
          
          <div className="relative p-12 md:p-20 text-center flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Stay Updated
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
              Get the latest updates about new features, upcoming events, and top job opportunities delivered straight to your inbox.
            </p>

            <form className="w-full max-w-md flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm transition-all"
                required
              />
              <button 
                type="submit" 
                className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                Subscribe
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-xs text-white/50 mt-4">We respect your privacy. No spam.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter
