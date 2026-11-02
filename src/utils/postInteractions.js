import API_BASE from './api';

const HIDDEN_POSTS_KEY = 'campusbridge_hidden_posts';
const MUTED_AUTHORS_KEY = 'campusbridge_muted_authors';

export const getHiddenPosts = () => {
  try {
    const data = localStorage.getItem(HIDDEN_POSTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addHiddenPost = async (postId, userClerkId) => {
  try {
    const list = getHiddenPosts();
    const strId = String(postId);
    if (!list.includes(strId)) {
      list.push(strId);
      localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify(list));
    }

    if (userClerkId) {
      fetch(`${API_BASE}/api/posts/${strId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userClerkId })
      }).catch(err => console.error('Failed to sync hidden post to server:', err));
    }
  } catch (e) {
    console.error('Error adding hidden post:', e);
  }
};

export const removeHiddenPost = (postId) => {
  try {
    const list = getHiddenPosts();
    const strId = String(postId);
    const updated = list.filter(id => id !== strId);
    localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('campusbridge_hidden_posts_changed', { detail: { hiddenPosts: updated } }));
  } catch (e) {
    console.error('Error removing hidden post:', e);
  }
};

export const unhidePost = async (postId, userClerkId) => {
  removeHiddenPost(postId);
  if (userClerkId) {
    fetch(`${API_BASE}/api/posts/${postId}/unhide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userClerkId })
    }).catch(err => console.error('Failed to unhide post on server:', err));
  }
};

export const unreportPost = async (postId, userClerkId) => {
  removeHiddenPost(postId);
  if (userClerkId) {
    try {
      await fetch(`${API_BASE}/api/posts/${postId}/unreport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterClerkId: userClerkId })
      });
    } catch (err) {
      console.error('Failed to cancel report on server:', err);
    }
  }
};

export const getMutedAuthors = () => {
  try {
    const data = localStorage.getItem(MUTED_AUTHORS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addMutedAuthor = async (authorClerkId, userClerkId) => {
  try {
    const list = getMutedAuthors();
    const strId = String(authorClerkId);
    if (!list.includes(strId)) {
      list.push(strId);
      localStorage.setItem(MUTED_AUTHORS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('campusbridge_muted_authors_changed', { detail: { mutedAuthors: list } }));
    }

    if (userClerkId) {
      fetch(`${API_BASE}/api/posts/mute-author`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userClerkId, targetClerkId: strId })
      }).catch(err => console.error('Failed to sync muted author to server:', err));
    }
  } catch (e) {
    console.error('Error adding muted author:', e);
  }
};

export const removeMutedAuthor = async (authorClerkId, userClerkId) => {
  try {
    const list = getMutedAuthors();
    const strId = String(authorClerkId);
    const updated = list.filter(id => id !== strId);
    localStorage.setItem(MUTED_AUTHORS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('campusbridge_muted_authors_changed', { detail: { mutedAuthors: updated } }));

    if (userClerkId) {
      fetch(`${API_BASE}/api/posts/unmute-author`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userClerkId, targetClerkId: strId })
      }).catch(err => console.error('Failed to sync unmuted author to server:', err));
    }
  } catch (e) {
    console.error('Error removing muted author:', e);
  }
};

