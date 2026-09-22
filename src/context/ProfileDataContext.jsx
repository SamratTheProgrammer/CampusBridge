import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import API_BASE from '../utils/api';

const ProfileDataContext = createContext({
  mongoProfile: null,
  isMongoProfileLoading: true,
  refetchMongoProfile: async () => {},
});

export const useProfileData = () => useContext(ProfileDataContext);

export const ProfileDataProvider = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [mongoProfile, setMongoProfile] = useState(null);
  const [isMongoProfileLoading, setIsMongoProfileLoading] = useState(true);

  const fetchMongoProfile = async () => {
    if (!user) return;
    try {
      setIsMongoProfileLoading(true);
      const res = await fetch(`${API_BASE}/api/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setMongoProfile(data);
      } else {
        console.error("Failed to fetch mongo profile, status:", res.status);
      }
    } catch (error) {
      console.error("Failed to fetch mongo profile:", error);
    } finally {
      setIsMongoProfileLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchMongoProfile();
    } else if (isLoaded && !user) {
      setIsMongoProfileLoading(false);
    }
  }, [user, isLoaded]);

  return (
    <ProfileDataContext.Provider value={{ mongoProfile, isMongoProfileLoading, refetchMongoProfile: fetchMongoProfile }}>
      {children}
    </ProfileDataContext.Provider>
  );
};
