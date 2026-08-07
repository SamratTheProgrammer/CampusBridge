import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: 'Is CampusBridge free?',
    answer: 'Yes, CampusBridge is completely free for students and alumni and mentor of partnered universities. We believe that access to mentorship and career opportunities should not be behind a paywall.'
  },
  {
    question: 'How can I become a mentor?',
    answer: 'If you are an alumnus with at least 1 year of professional experience, you can apply to become a mentor through your profile settings. Our team reviews applications within 48 hours.'
  },
  {
    question: 'How do I connect with mentor?',
    answer: 'You can use the Mentor Directory to filter by company, role, or location. Once you find someone, you can send them a connection request along with a personalized message.'
  },
  {
    question: 'Can mentor post jobs?',
    answer: 'Absolutely! Mentor can post job openings and internships directly to the job board. You can also indicate if you are willing to provide referrals for the roles you post.'
  },
  {
    question: 'How do mentorship sessions work?',
    answer: 'Once a mentor accepts your request, you can schedule a 30 or 60-minute session using our built-in calendar. Sessions take place via our integrated video call feature.'
  }
]

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="py-24 bg-muted/20">
      <div className="container max-w-3xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about the product and how it works.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card border rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-lg text-foreground pr-8">{faq.question}</span>
                <span className="shrink-0 p-1 bg-muted rounded-full text-foreground">
                  {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
