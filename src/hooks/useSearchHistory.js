import { useState, useEffect, useCallback } from 'react';
import {
  getLocalSearchHistory,
  fetchSearchHistory,
  saveSearchHistoryItem,
  removeSearchHistoryItem,
  clearAllSearchHistory
} from '../utils/searchHistoryService';

export function useSearchHistory(user) {
  const [history, setHistory] = useState(() => getLocalSearchHistory());
  const clerkId = user?.id || user?.clerkId;

  useEffect(() => {
    // Initial fetch from DB if clerkId is available
    if (clerkId) {
      fetchSearchHistory(clerkId).then((list) => {
        if (Array.isArray(list)) setHistory(list);
      });
    }

    // Listen for sync events across components (desktop search, SearchModal, etc.)
    const handleUpdate = (e) => {
      if (Array.isArray(e.detail)) {
        setHistory(e.detail);
      }
    };

    window.addEventListener('cb_search_history_updated', handleUpdate);
    return () => window.removeEventListener('cb_search_history_updated', handleUpdate);
  }, [clerkId]);

  const addToHistory = useCallback(
    (item) => {
      return saveSearchHistoryItem(clerkId, item);
    },
    [clerkId]
  );

  const removeFromHistory = useCallback(
    (itemOrId) => {
      return removeSearchHistoryItem(clerkId, itemOrId);
    },
    [clerkId]
  );

  const clearHistory = useCallback(() => {
    return clearAllSearchHistory(clerkId);
  }, [clerkId]);

  const refreshHistory = useCallback(async () => {
    if (clerkId) {
      try {
        const list = await fetchSearchHistory(clerkId);
        if (Array.isArray(list)) {
          setHistory(list);
          return list;
        }
      } catch (err) {
        console.debug('Error in refreshHistory:', err);
      }
    }
    return getLocalSearchHistory();
  }, [clerkId]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory,
  };
}

export default useSearchHistory;
