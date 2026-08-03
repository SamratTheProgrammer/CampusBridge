import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, KeyRound } from 'lucide-react'

const ForgotPassword = () => {
  const navigate = useNavigate()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // Navigate to OTP page for demo purposes
    navigate('/otp')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card border border-border/40 rounded-2xl p-8 shadow-xl text-center"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Forgot Password?</h1>
        <p className="text-muted-foreground mb-8">
          No worries, we'll send you reset instructions.
        </p>

        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input 
                type="email" 
                placeholder="name@example.com" 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all mt-6 shadow-md shadow-primary/20"
          >
            Reset Password
          </button>
        </form>

        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mt-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
