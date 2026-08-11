import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateStudentProfileProgress } from '../../utils/profileProgress';
import API_BASE from '../../utils/api'

const StudentProfileGuard = ({ children }) => {
  const { user, isLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [percentage, setPercentage] = useState(100);
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    // Check if it's a new account (e.g., created after August 1, 2026)
    // To only restrict new users, we define this cutoff date.
    const cutoffDate = new Date('2026-08-01T00:00:00Z');
    const isNewAccount = new Date(user.createdAt) >= cutoffDate;

    // Check role, ensure it's a student
    const role = user.publicMetadata?.role || user.unsafeMetadata?.role || sessionStorage.getItem('campusbridge_user_role');
    const isStudent = role !== 'mentor' && role !== 'admin' && role !== 'alumni';

    if (!isNewAccount || !isStudent) {
      setIsChecking(false);
      return;
    }

    const checkProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${user.id}`);
        let mongoData = null;
        if (res.ok) {
          mongoData = await res.json();
        }
        const prog = calculateStudentProfileProgress(mongoData, user);
        setPercentage(prog);
      } catch (err) {
        console.error("Error checking profile", err);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkProfile();
  }, [user, isLoaded, location.pathname]); // re-run check when navigating so completion updates

  // Allow access to settings page regardless
  if (location.pathname === '/dashboard/settings') {
    return <>{children}</>;
  }

  if (isChecking) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {percentage < 80 && showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
              
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3 text-center">Action Required</h2>
              <p className="text-muted-foreground mb-8 text-center">
                Please complete your profile to get the most out of CampusBridge. Your profile is currently <span className="font-bold text-amber-500">{percentage}%</span> complete.
              </p>
              <button 
                onClick={() => {
                  setShowModal(false);
                  navigate('/dashboard/settings');
                }}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Complete Profile Now
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentProfileGuard;
