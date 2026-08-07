import React from 'react'
import { MapPin, DollarSign, Clock, Building, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'

const jobs = [
  {
    id: 1,
    title: 'Frontend Developer',
    company: 'Microsoft',
    location: 'Remote',
    salary: '$120k - $150k',
    type: 'Full-time',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    posted: '2 days ago'
  },
  {
    id: 2,
    title: 'Product Designer',
    company: 'Airbnb',
    location: 'San Francisco, CA',
    salary: '$130k - $160k',
    type: 'Full-time',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg',
    posted: '5 hours ago'
  },
  {
    id: 3,
    title: 'Data Engineer',
    company: 'Spotify',
    location: 'New York, NY',
    salary: '$140k - $170k',
    type: 'Full-time',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
    posted: '1 day ago'
  }
]

const JobOpportunities = () => {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Latest Job Opportunities</h2>
            <p className="text-lg text-muted-foreground">
              Discover roles shared directly by mentor. Fast-track your application with a referral.
            </p>
          </div>
          <button className="text-primary font-medium hover:underline w-fit">
            See All Jobs &rarr;
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl border bg-background flex items-center justify-center p-2 shrink-0">
                  <img src={job.logo} alt={job.company} className="max-w-full max-h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-3">
                    <Building className="w-4 h-4" />
                    <span className="font-medium text-foreground">{job.company}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      {job.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-4 shrink-0 border-t md:border-none pt-4 md:pt-0">
                <span className="text-sm text-muted-foreground">Posted {job.posted}</span>
                <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                  Apply Now <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default JobOpportunities
