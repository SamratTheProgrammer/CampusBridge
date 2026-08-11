import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { INITIAL_COMMUNITIES } from '../../data/communityData'
import CommunityDetailModal from '../communities/CommunityDetailModal'

const Communities = () => {
  const [communitiesData, setCommunitiesData] = useState(INITIAL_COMMUNITIES)
  const [joinedCommunities, setJoinedCommunities] = useState(new Set())
  const [selectedCommunity, setSelectedCommunity] = useState(null)
  const [registeredEvents, setRegisteredEvents] = useState(new Set())

  // Toggle Join / Leave community
  const handleToggleJoin = (communityId, e) => {
    if (e) e.stopPropagation()

    setJoinedCommunities((prev) => {
      const next = new Set(prev)
      const comm = communitiesData.find((c) => c.id === communityId)
      const name = comm ? comm.name : 'Community'

      if (next.has(communityId)) {
        next.delete(communityId)
        toast.success(`You left the ${name} community`)
      } else {
        next.add(communityId)
        toast.success(`🎉 You joined the ${name} community!`, { duration: 4000 })
      }
      return next
    })
  }

  // Open community modal
  const handleCardClick = (community) => {
    setSelectedCommunity(community)
  }

  // Add new discussion to a specific community
  const handleAddDiscussion = (newDiscussion) => {
    if (!selectedCommunity) return

    setCommunitiesData((prev) =>
      prev.map((c) => {
        if (c.id === selectedCommunity.id) {
          const updatedDiscussions = [newDiscussion, ...(c.discussions || [])]
          const updatedCommunity = { ...c, discussions: updatedDiscussions }
          setSelectedCommunity(updatedCommunity)
          return updatedCommunity
        }
        return c
      })
    )
  }

  // Toggle event registration
  const handleToggleEventRegister = (eventId, eventTitle) => {
    setRegisteredEvents((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
        toast.success(`Cancelled registration for "${eventTitle}"`)
      } else {
        next.add(eventId)
        toast.success(`🎉 Successfully registered for "${eventTitle}"!`, { duration: 4000 })
      }
      return next
    })
  }

  return (
    <section className="py-24" id="resources">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Join Specialized Communities</h2>
          <p className="text-lg text-muted-foreground">
            Connect with peers sharing similar interests. Discuss trends, collaborate on projects, and grow together.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {communitiesData.map((community, index) => {
            const Icon = community.icon
            const isJoined = joinedCommunities.has(community.id)

            return (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleCardClick(community)}
                className="bg-card border rounded-2xl p-6 text-center hover:shadow-md transition-all group flex flex-col items-center justify-between cursor-pointer hover:border-primary/50 relative overflow-hidden"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${community.color} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-foreground mb-1 line-clamp-1" title={community.name}>
                  {community.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {isJoined ? community.membersCount + 1 : community.membersDisplay || community.membersCount} members
                </p>

                {isJoined ? (
                  <button
                    onClick={(e) => handleToggleJoin(community.id, e)}
                    className="text-emerald-500 text-sm font-bold flex items-center gap-1 hover:text-rose-500 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Joined
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleJoin(community.id)
                      handleCardClick(community)
                    }}
                    className="text-primary text-sm font-medium flex items-center gap-1 group-hover:underline cursor-pointer"
                  >
                    Join <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Community Detail Modal */}
      {selectedCommunity && (
        <CommunityDetailModal
          isOpen={!!selectedCommunity}
          onClose={() => setSelectedCommunity(null)}
          community={selectedCommunity}
          isJoined={joinedCommunities.has(selectedCommunity.id)}
          onToggleJoin={(id) => handleToggleJoin(id)}
          onAddDiscussion={handleAddDiscussion}
          registeredEvents={registeredEvents}
          onToggleEventRegister={handleToggleEventRegister}
        />
      )}
    </section>
  )
}

export default Communities
