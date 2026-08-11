import React from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, GraduationCap, Building2, Briefcase, Calendar, MessageCircle } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import API_BASE from '../../utils/api'

const Counter = ({ value, label, icon: Icon, delay = 0 }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </motion.div>
  )
}

const Statistics = () => {
  const [statsData, setStatsData] = useState({
    alumni: '12,000+',
    students: '8,000+',
    mentors: '2,000+',
    jobs: '5,000+',
    companies: '300+',
    events: '200+'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/platform-stats`);
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Alumni', value: statsData.alumni, icon: GraduationCap },
    { label: 'Students', value: statsData.students, icon: Users },
    { label: 'Mentors', value: statsData.mentors, icon: MessageCircle },
    { label: 'Jobs', value: statsData.jobs, icon: Briefcase },
    { label: 'Companies', value: statsData.companies, icon: Building2 },
    { label: 'Events', value: statsData.events, icon: Calendar },
  ]

  return (
    <section className="py-20">
      <div className="container max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Platform Statistics</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our growing community is making an impact across the globe. Join us and be part of the success story.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <Counter 
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Statistics
