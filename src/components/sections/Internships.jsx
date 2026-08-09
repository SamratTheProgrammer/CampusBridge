import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building, MapPin, ExternalLink } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const Internships = () => {
  const [internships, setInternships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const res = await fetch('/api/jobs')
        if (res.ok) {
          const data = await res.json()
          // Filter internships and take top 4
          const filtered = data.filter(j => j.type === 'Internship').slice(0, 4)
          setInternships(filtered)
        }
      } catch (error) {
        console.error('Error fetching internships:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInternships()
  }, [])

  const handleApply = (id) => {
    if (isLoaded && user) {
      navigate(`/dashboard/jobs/${id}`)
    } else {
      navigate('/signup')
    }
  }

  if (isLoading || internships.length === 0) {
    return null
  }
  return (
    <section className="py-24">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Top Internships</h2>
          <p className="text-lg text-muted-foreground">
            Kickstart your career with internships at industry-leading companies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {internships.map((internship, index) => {
            // Map the type field to something that looks like 'Paid' or 'Unpaid' if possible,
            // or just use the location for styling logic as a fallback
            const stipend = internship.salary || '-'
            const isPaid = stipend !== '-' && stipend !== ''
            
            return (
              <motion.div
                key={internship._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-card border rounded-2xl p-6 hover:border-primary/50 transition-colors shadow-sm flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${isPaid ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {internship.location || 'Remote'}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2 text-foreground">{internship.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Building className="w-4 h-4" />
                  <span>{internship.company}</span>
                </div>
                
                <div className="pt-4 border-t flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-xs text-muted-foreground">Stipend</p>
                    <p className="font-semibold text-foreground">{stipend}</p>
                  </div>
                  <button onClick={() => handleApply(internship._id)} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Internships
