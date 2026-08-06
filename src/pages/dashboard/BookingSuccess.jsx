import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Calendar, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const BookingSuccess = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-card border border-border/50 rounded-3xl p-8 sm:p-12 shadow-xl shadow-primary/10 max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
          className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">Booking Successful!</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Your mentorship request has been sent successfully. The mentor will review your request and confirm shortly.
        </p>

        <div className="space-y-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/dashboard/sessions')}
            className="w-full bg-background border border-border/50 text-foreground hover:bg-muted py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" /> View My Sessions
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default BookingSuccess
