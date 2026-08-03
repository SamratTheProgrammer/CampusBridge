import React from 'react'
import { motion } from 'framer-motion'
import { Building, MapPin, ExternalLink } from 'lucide-react'

const internships = [
  {
    role: 'Software Engineering Intern',
    company: 'Meta',
    type: 'Paid',
    location: 'Hybrid',
    stipend: '$8k/mo',
  },
  {
    role: 'Product Design Intern',
    company: 'Stripe',
    type: 'Paid',
    location: 'Remote',
    stipend: '$6k/mo',
  },
  {
    role: 'Data Science Intern',
    company: 'Netflix',
    type: 'Paid',
    location: 'On-site',
    stipend: '$9k/mo',
  },
  {
    role: 'Marketing Intern',
    company: 'Spotify',
    type: 'Unpaid',
    location: 'Remote',
    stipend: '-',
  }
]

const Internships = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Top Internships</h2>
          <p className="text-lg text-muted-foreground">
            Kickstart your career with internships at industry-leading companies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {internships.map((internship, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card border rounded-2xl p-6 hover:border-primary/50 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${internship.type === 'Paid' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                  {internship.type}
                </span>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">
                  {internship.location}
                </span>
              </div>

              <h3 className="font-bold text-lg mb-2 text-foreground">{internship.role}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Building className="w-4 h-4" />
                <span>{internship.company}</span>
              </div>
              
              <div className="pt-4 border-t flex items-center justify-between mt-auto">
                <div>
                  <p className="text-xs text-muted-foreground">Stipend</p>
                  <p className="font-semibold text-foreground">{internship.stipend}</p>
                </div>
                <button className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Internships
