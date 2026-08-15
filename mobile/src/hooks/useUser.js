import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/expo';
import apiClient from '../api/client';

export function useUser() {
  const { getToken, userId, isSignedIn } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const response = await apiClient.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch user:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
}
