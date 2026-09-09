import React, { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_BASE from '../../utils/api';
import RouteIntegrityLoader from '../../components/RouteIntegrityLoader';

const SyncUser = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/login');
      return;
    }

    if (isLoaded && user && !syncAttempted.current) {
      syncAttempted.current = true;
      const savedRole = localStorage.getItem('sso_role') || 'student';
      
      // Sync user with backend
      fetch(`${API_BASE}/api/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName || 'User',
          lastName: user.lastName || '',
          username: user.username || undefined,
          imageUrl: user.imageUrl,
          coverPhoto: user.unsafeMetadata?.coverPhoto || undefined,
          role: user.publicMetadata?.role || savedRole
        })
      })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'An error occurred during account sync.');
          if (data.existingRole) {
            sessionStorage.setItem('campusbridge_just_authenticated', 'true');
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
        sessionStorage.setItem('campusbridge_just_authenticated', 'true');
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
        sessionStorage.setItem('campusbridge_just_authenticated', 'true');
        navigate('/dashboard');
      });
    }
  }, [isLoaded, user, navigate]);

  return (
    <RouteIntegrityLoader 
      title="Verifying account integrity..."
      subtitle="Setting up your account and workspace..."
    />
  );
};

export default SyncUser;
