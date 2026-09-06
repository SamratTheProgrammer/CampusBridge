import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building, MapPin, ExternalLink } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import API_BASE from '../../utils/api'

const Internships = () => {
  const [internships, setInternships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs`)
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

        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {internships.map((internship, index) => {
            const stipend = internship.salary || '-'
            const isPaid = stipend !== '-' && stipend !== ''
            
            return (
              <motion.div
                key={internship._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-card border rounded-2xl p-5 hover:border-primary/50 transition-colors shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center"
              >
                {/* Company Logo */}
                <div className="w-14 h-14 shrink-0 rounded-xl bg-muted border overflow-hidden flex items-center justify-center">
                  {internship.companyLogo ? (
                    <img src={internship.companyLogo} alt={internship.company} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(internship.company || 'Company')}&background=random&color=fff`} alt={internship.company} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-lg text-foreground truncate">{internship.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isPaid ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-4 h-4" />
                      <span className="truncate">{internship.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{internship.location || 'Remote'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions & Stipend */}
                <div className="flex items-center sm:flex-col sm:items-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                  <div className="flex-1 sm:flex-none text-left sm:text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Stipend</p>
                    <p className="font-semibold text-foreground text-sm">{stipend}</p>
                  </div>
                  <button onClick={() => handleApply(internship._id)} className="px-4 py-2 bg-primary/10 text-primary font-medium text-sm rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2 shrink-0">
                    Apply Now <ExternalLink className="w-4 h-4" />
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
