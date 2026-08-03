import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', ''])
  const inputRefs = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input if there is a value
    if (value && index < 3) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 4).split('')
    if (pastedData.some(isNaN)) return

    const newOtp = [...otp]
    pastedData.forEach((value, index) => {
      newOtp[index] = value
    })
    setOtp(newOtp)
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 3)
    inputRefs.current[lastIndex].focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length === 4) {
      // Validate OTP here
      navigate('/') // Navigate on success
    }
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
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-8">
          We sent a verification code to <span className="font-medium text-foreground">name@example.com</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center gap-3 md:gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-14 h-14 md:w-16 md:h-16 text-center text-2xl font-bold rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            Verify & Proceed
          </button>
        </form>

        <div className="mt-8 text-sm text-muted-foreground">
          Didn't receive the code?{' '}
          <button className="font-medium text-primary hover:underline">
            Click to resend
          </button>
        </div>

        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mt-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
      </motion.div>
    </div>
  )
}

export default OTPVerification
