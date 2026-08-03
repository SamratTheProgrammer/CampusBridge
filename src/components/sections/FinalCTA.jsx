import React from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Search } from 'lucide-react'

const FinalCTA = () => {
  return (
    <section className="py-24 border-t bg-muted/20">
      <div className="container mx-auto px-4 lg:px-8 text-center max-w-4xl">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-8 text-foreground leading-tight">
          Ready to Build Your Future?
        </h2>
        <p className="text-xl text-muted-foreground mb-10">
          Join thousands of students and alumni who are already accelerating their careers with CampusBridge.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-lg">
            Join CampusBridge
            <UserPlus className="w-5 h-5" />
          </Link>
          <Link to="/alumni" className="w-full sm:w-auto px-8 py-4 bg-card text-foreground border-2 rounded-full font-bold hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-lg">
            Explore Alumni
            <Search className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
