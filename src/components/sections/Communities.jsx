import React from 'react'
import { motion } from 'framer-motion'
import { Users, Code, Cloud, Shield, Layout, Brain, ArrowRight } from 'lucide-react'

const communities = [
  { name: 'AI & Machine Learning', icon: Brain, members: '2.4k', color: 'bg-purple-500/10 text-purple-600' },
  { name: 'Cloud Computing', icon: Cloud, members: '1.8k', color: 'bg-blue-500/10 text-blue-600' },
  { name: 'Web Development', icon: Code, members: '3.2k', color: 'bg-orange-500/10 text-orange-600' },
  { name: 'Cyber Security', icon: Shield, members: '1.1k', color: 'bg-red-500/10 text-red-600' },
  { name: 'UI/UX Design', icon: Layout, members: '1.5k', color: 'bg-pink-500/10 text-pink-600' },
  { name: 'Data Structures (DSA)', icon: Users, members: '4.5k', color: 'bg-green-500/10 text-green-600' },
]

const Communities = () => {
  return (
    <section className="py-24">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Join Specialized Communities</h2>
          <p className="text-lg text-muted-foreground">
            Connect with peers sharing similar interests. Discuss trends, collaborate on projects, and grow together.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {communities.map((community, index) => {
            const Icon = community.icon
            return (
              <motion.div
                key={community.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-card border rounded-2xl p-6 text-center hover:shadow-md transition-shadow group flex flex-col items-center justify-between"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${community.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-foreground mb-1 line-clamp-1" title={community.name}>{community.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{community.members} members</p>
                
                <button className="text-primary text-sm font-medium flex items-center gap-1 group-hover:underline">
                  Join <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Communities
