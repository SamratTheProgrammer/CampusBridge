import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateStudentProfileProgress } from '../../utils/profileProgress';

const StudentProfileGuard = ({ children }) => {
  const { user, isLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [percentage, setPercentage] = useState(100);
  const [isChecking, setIsChecking] = useState(true);

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
        const res = await fetch(`/api/users/${user.id}`);
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
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (percentage < 100) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Action Required</h2>
          <p className="text-muted-foreground mb-8">
            Please complete your profile to access all CampusBridge features. Your profile is currently <span className="font-bold text-amber-500">{percentage}%</span> complete.
          </p>
          <button 
            onClick={() => navigate('/dashboard/settings')}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            Complete Profile Now
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default StudentProfileGuard;
