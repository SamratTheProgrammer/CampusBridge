import API_BASE from './api';

const STORAGE_KEY = 'campusbridge_search_history';

/**
 * Get cached search history from localStorage
 */
export const getLocalSearchHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to read local search history', err);
  }
  return [];
};

/**
 * Set search history into localStorage and dispatch sync event
 */
export const setLocalSearchHistory = (historyList) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cb_search_history_updated', { detail: historyList }));
    }
  } catch (err) {
    console.error('Failed to save local search history', err);
  }
};

/**
 * Fetch search history from backend DB for logged in user (with fallback to local storage)
 */
export const fetchSearchHistory = async (clerkId) => {
  const local = getLocalSearchHistory();
  if (!clerkId) return local;

  try {
    const res = await fetch(`${API_BASE}/api/search/history?clerkId=${encodeURIComponent(clerkId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setLocalSearchHistory(data.history);
        return data.history;
      }
    }
  } catch (err) {
    console.debug('Failed to fetch search history from DB, using local cache', err);
  }

  return local;
};

/**
 * Hydrate local search history items with fresh user data (live DP, full name, role, etc.)
 */
export const hydrateLocalHistoryWithUsers = (historyList, usersList = [], currentUser = null) => {
  if (!Array.isArray(historyList) || historyList.length === 0) return [];
  if (!Array.isArray(usersList) && !currentUser) return historyList;

  const usersMap = {};
  if (Array.isArray(usersList)) {
    for (const u of usersList) {
      if (u.clerkId) usersMap[u.clerkId] = u;
      if (u._id) usersMap[u._id] = u;
      if (u.id) usersMap[u.id] = u;
      if (u.username) usersMap[u.username.toLowerCase()] = u;
      if (u.name) usersMap[u.name.toLowerCase()] = u;
    }
  }

  return historyList.map(item => {
    const isUser = item.type === 'user' || (item.path && item.path.startsWith('/profile/')) || item.role;
    if (!isUser) return item;

    let matched = null;
    const tid = item.targetId || item.id;
    if (tid && usersMap[tid]) matched = usersMap[tid];

    if (!matched && item.path && item.path.startsWith('/profile/')) {
      const slug = item.path.replace(/^\/profile\//, '').split('?')[0].split('#')[0].trim();
      if (slug) {
        matched = usersMap[slug] || usersMap[slug.toLowerCase()];
      }
    }

    if (!matched && item.title) {
      matched = usersMap[item.title.toLowerCase()];
    }

    // Also check current logged-in user
    if (currentUser) {
      const isCurrent =
        (currentUser.id && (tid === currentUser.id || item.targetId === currentUser.id)) ||
        (currentUser.username && item.path?.toLowerCase().includes(currentUser.username.toLowerCase())) ||
        (currentUser.fullName && (item.title === currentUser.fullName || item.query === currentUser.fullName));
      if (isCurrent) {
        matched = {
          ...matched,
          imageUrl: currentUser.imageUrl || matched?.imageUrl,
          name: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || matched?.name,
          role: currentUser.publicMetadata?.role || currentUser.unsafeMetadata?.role || matched?.role || 'student'
        };
      }
    }

    if (matched) {
      const fullName = `${matched.firstName || ''} ${matched.lastName || ''}`.trim() || matched.name || item.title;
      const imageUrl = matched.imageUrl !== undefined ? matched.imageUrl : item.image;
      return {
        ...item,
        type: 'user',
        title: fullName,
        image: imageUrl,
        role: (matched.role || item.role || '').toLowerCase(),
        description: matched.headline || (matched.company ? `At ${matched.company}` : item.description),
        badge: (matched.role === 'mentor' ? 'Mentor' : (matched.role === 'alumni' ? 'Alumni' : 'Student'))
      };
    }

    return item;
  });
};

/**
 * Add an item to search history (optimistic update + DB sync)
 */
export const saveSearchHistoryItem = async (clerkId, rawItem) => {
  if (!rawItem) return getLocalSearchHistory();

  let item = null;
  if (typeof rawItem === 'string') {
    const q = rawItem.trim();
    if (!q) return getLocalSearchHistory();
    item = {
      query: q,
      title: q,
      description: '',
      image: '',
      type: 'text',
      path: '',
      role: '',
      badge: '',
      targetId: `hist-${Date.now()}`
    };
  } else {
    const titleOrQuery = (rawItem.title || rawItem.query || rawItem.name || '').trim();
    if (!titleOrQuery) return getLocalSearchHistory();
    const isProfilePath = rawItem.path && rawItem.path.startsWith('/profile/');
    item = {
      query: titleOrQuery,
      title: rawItem.title || rawItem.name || titleOrQuery,
      description: rawItem.description || rawItem.headline || '',
      image: rawItem.image || rawItem.imageUrl || '',
      type: rawItem.type || (isProfilePath ? 'user' : (rawItem.path ? 'nav' : (rawItem.role ? 'user' : 'text'))),
      path: rawItem.path || '',
      role: rawItem.role || '',
      badge: rawItem.badge || '',
      targetId: rawItem.targetId || rawItem.id || rawItem._id || (isProfilePath ? rawItem.path.replace(/^\/profile\//, '') : `hist-${Date.now()}`)
    };
  }

  // 1. Optimistic local update
  const current = getLocalSearchHistory();
  const lowerQuery = (item.query || item.title || '').toLowerCase();
  const lowerPath = (item.path || '').toLowerCase();

  const filtered = current.filter((h) => {
    const hTitle = (h.title || '').toLowerCase();
    const hQuery = (h.query || '').toLowerCase();
    const hPath = (h.path || '').toLowerCase();

    if (lowerPath && hPath && lowerPath === hPath) return false;
    if (hTitle === lowerQuery || hQuery === lowerQuery) return false;
    return true;
  });

  const updated = [
    { ...item, id: item.targetId || `hist-${Date.now()}`, createdAt: new Date().toISOString() },
    ...filtered
  ].slice(0, 20);

  setLocalSearchHistory(updated);

  // 2. Sync to Backend DB if logged in
  if (clerkId) {
    fetch(`${API_BASE}/api/search/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId, item })
    }).catch(err => console.debug('Failed to sync search history item to DB', err));
  }

  return updated;
};

/**
 * Remove a specific item from search history (optimistic update + DB sync)
 */
export const removeSearchHistoryItem = async (clerkId, itemOrId) => {
  const current = getLocalSearchHistory();
  const targetId = typeof itemOrId === 'string' ? itemOrId : (itemOrId?.id || itemOrId?._id || itemOrId?.targetId);
  const targetQuery = typeof itemOrId === 'object' ? (itemOrId?.query || itemOrId?.title) : itemOrId;

  const updated = current.filter((h) => {
    if (targetId && (h.id === targetId || h._id === targetId || h.targetId === targetId)) return false;
    if (targetQuery && (h.query || h.title || '').toLowerCase() === String(targetQuery).toLowerCase()) return false;
    return true;
  });

  setLocalSearchHistory(updated);

  if (clerkId) {
    fetch(`${API_BASE}/api/search/history/item`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId,
        id: targetId,
        query: typeof targetQuery === 'string' ? targetQuery : undefined,
      })
    }).catch(err => console.debug('Failed to sync history item deletion to DB', err));
  }

  return updated;
};

/**
 * Clear all search history (optimistic update + DB sync)
 */
export const clearAllSearchHistory = async (clerkId) => {
  setLocalSearchHistory([]);

  if (clerkId) {
    fetch(`${API_BASE}/api/search/history/clear`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId })
    }).catch(err => console.debug('Failed to sync clear history to DB', err));
  }

  return [];
};
