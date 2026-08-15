import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, Image,
  RefreshControl, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';

import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../theme/colors';
import { useUser } from '../../hooks/useUser';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import apiClient from '../../api/client';

// ── Helpers ────────────────────────────────────────────────────────
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const getAuthorName = (author) =>
  author?.name || [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'User';

// Gradient map matching the web app
const GRADIENT_MAP = {
  'bg-gradient-to-r from-purple-500 to-indigo-500': ['#a855f7', '#6366f1'],
  'bg-gradient-to-r from-pink-500 to-rose-500': ['#ec4899', '#f43f5e'],
  'bg-gradient-to-r from-cyan-500 to-blue-500': ['#06b6d4', '#3b82f6'],
  'bg-gradient-to-r from-amber-500 to-orange-500': ['#f59e0b', '#f97316'],
  'bg-gradient-to-r from-emerald-500 to-teal-500': ['#10b981', '#14b8a6'],
};

// ── Main Component ────────────────────────────────────────────────
export default function HomeScreen() {
  const { getToken, userId } = useAuth();
  const { user, loading: userLoading } = useUser();

  // Feed state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Widgets
  const [suggestedMentors, setSuggestedMentors] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [profileViews, setProfileViews] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [connections, setConnections] = useState({});
  const [isConnecting, setIsConnecting] = useState(null);

  // Create post state
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Comments
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data || []);
    } catch (e) {
      console.error('Posts fetch error:', e?.message);
    } finally {
      setLoadingPosts(false);
    }
  }, [getToken]);

  const fetchWidgets = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [mentorsRes, jobsRes, connsRes, userRes] = await Promise.allSettled([
        apiClient.get(`/api/users/mentors/suggested?userId=${userId}`, { headers }),
        apiClient.get('/api/jobs', { headers }),
        apiClient.get(`/api/connections/user/${userId}`, { headers }),
        apiClient.get(`/api/users/${userId}`, { headers }),
      ]);

      if (mentorsRes.status === 'fulfilled') {
        setSuggestedMentors((mentorsRes.value.data || []).slice(0, 8));
      }
      if (jobsRes.status === 'fulfilled') {
        const jobs = Array.isArray(jobsRes.value.data)
          ? jobsRes.value.data
          : (jobsRes.value.data?.jobs || []);
        setRecentJobs(jobs.filter(j => j.active !== false).slice(0, 4));
      }
      if (connsRes.status === 'fulfilled') {
        const connsData = connsRes.value.data || [];
        const connMap = {};
        let accepted = 0;
        connsData.forEach(c => {
          if (c.requesterClerkId === userId) connMap[c.recipientClerkId] = c.status;
          else if (c.recipientClerkId === userId) connMap[c.requesterClerkId] = c.status;
          if (c.status === 'accepted') accepted++;
        });
        setConnections(connMap);
        setConnectionsCount(accepted);
      }
      if (userRes.status === 'fulfilled') {
        setProfileViews(userRes.value.data?.profileViews || 0);
      }
    } catch (e) {
      console.error('Widget fetch error:', e?.message);
    }
  }, [getToken, userId]);

  useEffect(() => {
    fetchPosts();
    fetchWidgets();
  }, [fetchPosts, fetchWidgets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), fetchWidgets()]);
    setRefreshing(false);
  };

  // ── Actions ─────────────────────────────────────────────────────
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    try {
      const token = await getToken();
      await apiClient.post('/api/posts', {
        authorClerkId: userId,
        content: newPostContent,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewPostContent('');
      fetchPosts();
    } catch (e) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId) => {
    if (!userId) return;
    // Optimistic UI
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const safeLikes = p.likes || [];
      const hasLiked = safeLikes.some(l => (l.clerkId || l) === userId);
      const newLikes = hasLiked
        ? safeLikes.filter(l => (l.clerkId || l) !== userId)
        : [...safeLikes, { clerkId: userId, name: user?.name || 'You' }];
      return { ...p, likes: newLikes };
    }));
    try {
      const token = await getToken();
      await apiClient.put(`/api/posts/${postId}/like`, { clerkId: userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      fetchPosts(); // revert on failure
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim() || !userId) return;
    setIsCommenting(true);
    try {
      const token = await getToken();
      await apiClient.post(`/api/posts/${postId}/comment`, {
        authorClerkId: userId,
        content: commentText,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentText('');
      fetchPosts();
    } catch (e) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleConnect = async (mentorClerkId) => {
    if (!userId) return;
    setIsConnecting(mentorClerkId);
    try {
      const token = await getToken();
      await apiClient.post('/api/connections', {
        requesterClerkId: userId,
        recipientClerkId: mentorClerkId,
        message: 'Hi, I found you in suggested mentors and would love to connect!',
      }, { headers: { Authorization: `Bearer ${token}` } });
      setConnections(prev => ({ ...prev, [mentorClerkId]: 'pending' }));
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to connect');
    } finally {
      setIsConnecting(null);
    }
  };

  // ── Renderers ───────────────────────────────────────────────────
  const renderLikesText = (likes) => {
    if (!likes || likes.length === 0) return '0 likes';
    const hasLiked = userId && likes.some(l => (l.clerkId || l) === userId);
    const count = likes.length;
    if (count === 1) return hasLiked ? 'You liked this' : `${likes[0].name || 'Someone'} liked this`;
    if (hasLiked) return `You and ${count - 1} other${count - 1 > 1 ? 's' : ''}`;
    return `${likes[0].name || 'Someone'} and ${count - 1} other${count - 1 > 1 ? 's' : ''}`;
  };

  // ── Render Post Card ────────────────────────────────────────────
  const renderPost = (post) => {
    const safeLikes = post.likes || [];
    const hasLiked = userId && safeLikes.some(l => (l.clerkId || l) === userId);
    const comments = post.comments || [];
    const showComments = activeCommentPostId === post._id;
    const gradientColors = post.bgGradient ? GRADIENT_MAP[post.bgGradient] : null;

    return (
      <Card key={post._id} style={styles.postCard}>
        {/* Author Row */}
        <View style={styles.postAuthorRow}>
          <Avatar uri={post.author?.image} name={getAuthorName(post.author)} size={44} />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{getAuthorName(post.author)}</Text>
            <Text style={styles.postAuthorRole}>{post.author?.role || 'Member'}</Text>
            <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>

        {/* Post Content */}
        {gradientColors ? (
          <LinearGradient colors={gradientColors} style={styles.gradientPost} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.gradientPostText}>{post.content}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.postContent}>{post.content}</Text>
        )}

        {/* Post Image */}
        {post.imageUrl && !post.bgGradient && (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
        )}

        {/* Event Details */}
        {post.eventDetails?.title && (
          <View style={styles.eventCard}>
            <View style={styles.eventIconBox}>
              <Ionicons name="calendar" size={20} color="#f97316" />
            </View>
            <View style={styles.eventInfo}>
              <Badge label={post.eventDetails.type || 'Event'} variant="primary" />
              <Text style={styles.eventTitle} numberOfLines={1}>{post.eventDetails.title}</Text>
              <View style={styles.eventMetaRow}>
                {post.eventDetails.date && (
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.eventMetaText}>{new Date(post.eventDetails.date).toLocaleDateString()}</Text>
                  </View>
                )}
                {post.eventDetails.time && (
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.eventMetaText}>{post.eventDetails.time}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Likes + Comments Count */}
        <View style={styles.engagementRow}>
          <View style={styles.engagementLeft}>
            {safeLikes.length > 0 && (
              <View style={styles.likeIndicator}>
                <View style={styles.likeCircle}>
                  <Ionicons name="heart" size={8} color="#fff" />
                </View>
                <Text style={styles.engagementText}>{renderLikesText(safeLikes)}</Text>
              </View>
            )}
          </View>
          {comments.length > 0 && (
            <TouchableOpacity onPress={() => setActiveCommentPostId(showComments ? null : post._id)}>
              <Text style={styles.engagementText}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={styles.postDivider} />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post._id)}>
            <Ionicons name={hasLiked ? 'heart' : 'heart-outline'} size={20} color={hasLiked ? '#ef4444' : Colors.textMuted} />
            <Text style={[styles.actionText, hasLiked && { color: '#ef4444' }]}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveCommentPostId(showComments ? null : post._id)}>
            <Ionicons name="chatbubble-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {showComments && (
          <View style={styles.commentsSection}>
            <View style={styles.commentsDivider} />
            {comments.map((c, i) => (
              <View key={c._id || i} style={styles.commentItem}>
                <Avatar uri={c.author?.image} name={getAuthorName(c.author)} size={30} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{getAuthorName(c.author)}</Text>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              </View>
            ))}
            {/* Write comment */}
            <View style={styles.commentInputRow}>
              <Avatar uri={user?.imageUrl || user?.profileImage} name={user?.name || user?.firstName} size={28} />
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={Colors.textMuted}
                value={activeCommentPostId === post._id ? commentText : ''}
                onChangeText={setCommentText}
                selectionColor={Colors.primary}
              />
              <TouchableOpacity
                onPress={() => handleComment(post._id)}
                disabled={isCommenting || !commentText.trim()}
              >
                <Ionicons name="send" size={18} color={commentText.trim() ? Colors.primary : Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>
    );
  };

  // ── Main Render ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Profile Header Card ────────────────────────────── */}
        <Card style={styles.profileCard}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.profileBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.profileContent}>
            <View style={styles.profileAvatarWrap}>
              <Avatar uri={user?.imageUrl || user?.profileImage} name={user?.name || user?.firstName} size={56} />
            </View>
            <Text style={styles.profileName}>{userLoading ? '...' : (user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Student')}</Text>
            <Text style={styles.profileHeadline}>{user?.headline || user?.role || 'Student'}</Text>
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{profileViews}</Text>
                <Text style={styles.profileStatLabel}>Profile Views</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{connectionsCount}</Text>
                <Text style={styles.profileStatLabel}>Connections</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ── Create Post Box ────────────────────────────────── */}
        <Card style={styles.createPostCard}>
          <View style={styles.createPostRow}>
            <Avatar uri={user?.imageUrl || user?.profileImage} name={user?.name || user?.firstName} size={40} />
            <TextInput
              style={styles.createPostInput}
              placeholder="Start a post..."
              placeholderTextColor={Colors.textMuted}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              selectionColor={Colors.primary}
            />
          </View>
          <View style={styles.createPostFooter}>
            <View style={styles.createPostActions}>
              <TouchableOpacity style={styles.createPostActionBtn}>
                <Ionicons name="image-outline" size={20} color="#3b82f6" />
                <Text style={[styles.createPostActionText, { color: '#3b82f6' }]}>Media</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createPostActionBtn}>
                <Ionicons name="calendar-outline" size={20} color="#f97316" />
                <Text style={[styles.createPostActionText, { color: '#f97316' }]}>Event</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createPostActionBtn}>
                <Ionicons name="briefcase-outline" size={20} color="#a855f7" />
                <Text style={[styles.createPostActionText, { color: '#a855f7' }]}>Job</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.postButton, (!newPostContent.trim() || isPosting) && styles.postButtonDisabled]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── Suggested Mentors ──────────────────────────────── */}
        {suggestedMentors.filter(m => m.clerkId !== userId && connections[m.clerkId] !== 'accepted').length > 0 && (
          <View style={styles.widgetSection}>
            <Text style={styles.widgetTitle}>Suggested Mentors</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mentorsScroll}>
              {suggestedMentors
                .filter(m => m.clerkId !== userId && connections[m.clerkId] !== 'accepted')
                .map((mentor) => (
                  <Card key={mentor._id || mentor.clerkId} style={styles.mentorCard}>
                    <Avatar uri={mentor.imageUrl} name={`${mentor.firstName} ${mentor.lastName || ''}`} size={48} />
                    <Text style={styles.mentorName} numberOfLines={1}>{mentor.firstName} {mentor.lastName || ''}</Text>
                    <Text style={styles.mentorRole} numberOfLines={1}>{mentor.headline || mentor.role}</Text>
                    {connections[mentor.clerkId] === 'pending' ? (
                      <View style={styles.pendingBtn}>
                        <Ionicons name="checkmark" size={12} color={Colors.textMuted} />
                        <Text style={styles.pendingBtnText}>Sent</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => handleConnect(mentor.clerkId)}
                        disabled={isConnecting === mentor.clerkId}
                      >
                        {isConnecting === mentor.clerkId ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <>
                            <Ionicons name="person-add-outline" size={12} color={Colors.primary} />
                            <Text style={styles.connectBtnText}>Connect</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </Card>
                ))}
            </ScrollView>
          </View>
        )}

        {/* ── Feed Posts ──────────────────────────────────────── */}
        {loadingPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        ) : posts.length > 0 ? (
          posts.map(renderPost)
        ) : (
          <Card style={styles.emptyCard}>
            <Ionicons name="newspaper-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to share something!</Text>
          </Card>
        )}

        {/* ── Recent Jobs Widget ─────────────────────────────── */}
        {recentJobs.length > 0 && (
          <Card style={styles.jobsWidget}>
            <Text style={styles.widgetTitle}>Recent Jobs</Text>
            {recentJobs.map((job, i) => (
              <View key={job._id || i}>
                <View style={styles.jobItem}>
                  <View style={styles.jobIconBox}>
                    <Ionicons name="briefcase" size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.jobMeta} numberOfLines={1}>{job.company || 'Company'} • {job.location || 'Remote'}</Text>
                    <Text style={styles.jobTime}>{job.createdAt ? formatTime(job.createdAt) : 'Recently posted'}</Text>
                  </View>
                </View>
                {i < recentJobs.length - 1 && <View style={styles.jobDivider} />}
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 24 },

  // Profile Card
  profileCard: { marginTop: 0, padding: 0, overflow: 'hidden', borderRadius: 0 },
  profileBanner: { height: 64 },
  profileContent: { alignItems: 'center', paddingBottom: 16, paddingHorizontal: 16 },
  profileAvatarWrap: { marginTop: -28, marginBottom: 8, borderRadius: 30, borderWidth: 3, borderColor: Colors.card, overflow: 'hidden' },
  profileName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  profileHeadline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  profileStats: { flexDirection: 'row', marginTop: 14, width: '100%', borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: 12 },
  profileStatItem: { flex: 1, alignItems: 'center' },
  profileStatDivider: { width: 1, backgroundColor: Colors.surfaceBorder },
  profileStatValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  profileStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Create Post
  createPostCard: { marginTop: 8, borderRadius: 0 },
  createPostRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  createPostInput: {
    flex: 1, color: Colors.textPrimary, fontSize: FontSize.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, paddingVertical: 10, minHeight: 60,
    borderWidth: 1, borderColor: Colors.surfaceBorder, textAlignVertical: 'top',
  },
  createPostFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createPostActions: { flexDirection: 'row', gap: 4 },
  createPostActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  createPostActionText: { fontSize: FontSize.xs, fontWeight: '600' },
  postButton: {
    backgroundColor: Colors.secondary, paddingHorizontal: 22, paddingVertical: 10,
    borderRadius: BorderRadius.md, 
    borderBottomWidth: 3, borderBottomColor: Colors.secondaryDark,
    ...Shadow.md,
  },
  postButtonDisabled: { opacity: 0.5, borderBottomWidth: 0, marginTop: 3 },
  postButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800', letterSpacing: 0.5 },

  // Suggested Mentors
  widgetSection: { marginTop: 16 },
  widgetTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, paddingLeft: 4 },
  mentorsScroll: { gap: 10, paddingBottom: 4 },
  mentorCard: { width: 140, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10 },
  mentorName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginTop: 8, textAlign: 'center' },
  mentorRole: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, marginBottom: 10, textAlign: 'center' },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.primary + '40', borderRadius: BorderRadius.full,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  connectBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  pendingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: BorderRadius.full,
    paddingVertical: 5, paddingHorizontal: 12, backgroundColor: Colors.surface,
  },
  pendingBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },

  // Post Card
  postCard: { marginTop: 8, borderRadius: 0 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  postAuthorInfo: { flex: 1 },
  postAuthorName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  postAuthorRole: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize', marginTop: 1 },
  postTime: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  postContent: { fontSize: FontSize.md, color: 'rgba(241,245,249,0.9)', lineHeight: 22, marginBottom: 12 },

  // Gradient post
  gradientPost: { borderRadius: BorderRadius.md, minHeight: 180, justifyContent: 'center', alignItems: 'center', padding: 20, marginBottom: 12 },
  gradientPostText: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800', textAlign: 'center', lineHeight: 28, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  // Post image
  postImage: { width: '100%', height: 220, borderRadius: BorderRadius.md, marginBottom: 12, backgroundColor: Colors.surface },

  // Event details inside post
  eventCard: {
    flexDirection: 'row', gap: 12, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    padding: 12, marginBottom: 12,
  },
  eventIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.1)', justifyContent: 'center', alignItems: 'center' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  eventMetaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  eventMetaText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },

  // Engagement
  engagementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  engagementLeft: { flexDirection: 'row', alignItems: 'center' },
  likeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  engagementText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },

  // Dividers
  postDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginBottom: 8 },
  commentsDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginBottom: 12 },

  // Action Buttons
  actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  actionText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },

  // Comments
  commentsSection: { marginTop: 10, paddingTop: 4 },
  commentItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentBubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 10 },
  commentAuthor: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  commentContent: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  commentInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: FontSize.sm, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },

  // Loading / Empty
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  emptyCard: { marginTop: 12, alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Jobs Widget
  jobsWidget: { marginTop: 8, borderRadius: 0 },
  jobItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  jobIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.15)', justifyContent: 'center', alignItems: 'center' },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  jobMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  jobTime: { fontSize: 10, color: Colors.textMuted, fontWeight: '500', marginTop: 2 },
  jobDivider: { height: 1, backgroundColor: Colors.surfaceBorder },
});
