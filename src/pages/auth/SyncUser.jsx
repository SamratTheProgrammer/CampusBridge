import React, { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SyncUser = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !syncAttempted.current) {
      syncAttempted.current = true;
      const savedRole = localStorage.getItem('sso_role') || 'student';
      
      // Sync user with backend
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName || 'User',
          lastName: user.lastName || '',
          username: user.username || undefined,
          imageUrl: user.imageUrl,
          role: user.publicMetadata?.role || savedRole
        })
      })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'An error occurred during account sync.');
          if (data.existingRole) {
            sessionStorage.setItem('campusbridge_user_role', data.existingRole);
            if (data.existingRole === 'mentor') {
              navigate('/mentor-dashboard');
            } else {
              navigate('/dashboard');
            }
          } else {
            navigate('/login');
          }
          return;
        }

        const finalRole = data.role || user.publicMetadata?.role || savedRole;
        sessionStorage.setItem('campusbridge_user_role', finalRole);

        if (finalRole === 'mentor') {
          navigate('/mentor-dashboard');
        } else {
          navigate('/dashboard');
        }
        localStorage.removeItem('sso_role');
      })
      .catch(err => {
        console.error('Error syncing user:', err);
        navigate('/dashboard');
      });
    }
  }, [isLoaded, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Setting up your account...</p>
    </div>
  );
};

export default SyncUser;
