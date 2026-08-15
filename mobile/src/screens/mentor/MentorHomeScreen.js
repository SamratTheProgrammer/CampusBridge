import React, { useEffect, useState, useCallback } from 'react';
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

const GRADIENT_MAP = {
  'bg-gradient-to-r from-purple-500 to-indigo-500': ['#a855f7', '#6366f1'],
  'bg-gradient-to-r from-pink-500 to-rose-500': ['#ec4899', '#f43f5e'],
  'bg-gradient-to-r from-cyan-500 to-blue-500': ['#06b6d4', '#3b82f6'],
  'bg-gradient-to-r from-amber-500 to-orange-500': ['#f59e0b', '#f97316'],
  'bg-gradient-to-r from-emerald-500 to-teal-500': ['#10b981', '#14b8a6'],
};

// ── Main Component ────────────────────────────────────────────────
export default function MentorHomeScreen() {
  const { getToken, userId } = useAuth();
  const { user, loading: userLoading } = useUser();

  // Feed state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mentor Widgets state
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);

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
      const [sessRes, reqRes] = await Promise.allSettled([
        apiClient.get('/api/sessions/mentor', { headers }),
        apiClient.get('/api/connections/requests', { headers }),
      ]);
      if (sessRes.status === 'fulfilled') {
        setSessions((sessRes.value.data?.sessions || sessRes.value.data || []).slice(0, 3));
      }
      if (reqRes.status === 'fulfilled') {
        setRequests((reqRes.value.data?.requests || reqRes.value.data || []).slice(0, 3));
      }
    } catch (e) {
      console.error('Widget fetch error:', e?.message);
    }
  }, [getToken]);

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
      fetchPosts();
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

  // ── Renderers ───────────────────────────────────────────────────
  const renderLikesText = (likes) => {
    if (!likes || likes.length === 0) return '0 likes';
    const hasLiked = userId && likes.some(l => (l.clerkId || l) === userId);
    const count = likes.length;
    if (count === 1) return hasLiked ? 'You liked this' : `${likes[0].name || 'Someone'} liked this`;
    if (hasLiked) return `You and ${count - 1} other${count - 1 > 1 ? 's' : ''}`;
    return `${likes[0].name || 'Someone'} and ${count - 1} other${count - 1 > 1 ? 's' : ''}`;
  };

  const statCards = [
    { label: 'Active Mentees', value: user?.menteesCount || 0, icon: 'people', color: Colors.primary, bg: 'rgba(99,102,241,0.15)' },
    { label: 'Sessions', value: user?.sessionsCount || 0, icon: 'time', color: Colors.secondary, bg: 'rgba(168,85,247,0.15)' },
    { label: 'Requests', value: requests.length, icon: 'mail', color: Colors.warning, bg: Colors.warningBg },
    { label: 'Rating', value: user?.rating?.toFixed(1) || 'N/A', icon: 'star', color: Colors.success, bg: Colors.successBg },
  ];

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

        {/* Content */}
        {gradientColors ? (
          <LinearGradient colors={gradientColors} style={styles.gradientPost} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.gradientPostText}>{post.content}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.postContent}>{post.content}</Text>
        )}

        {/* Image */}
        {post.imageUrl && !post.bgGradient && (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
        )}

        {/* Event */}
        {post.eventDetails?.title && (
          <View style={styles.eventCard}>
            <View style={styles.eventIconBox}><Ionicons name="calendar" size={20} color="#f97316" /></View>
            <View style={styles.eventInfo}>
              <Badge label={post.eventDetails.type || 'Event'} variant="primary" />
              <Text style={styles.eventTitle} numberOfLines={1}>{post.eventDetails.title}</Text>
            </View>
          </View>
        )}

        {/* Engagement */}
        <View style={styles.engagementRow}>
          <View style={styles.engagementLeft}>
            {safeLikes.length > 0 && (
              <View style={styles.likeIndicator}>
                <View style={styles.likeCircle}><Ionicons name="heart" size={8} color="#fff" /></View>
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

        <View style={styles.postDivider} />

        {/* Actions */}
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

        {/* Comments */}
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
              <TouchableOpacity onPress={() => handleComment(post._id)} disabled={isCommenting || !commentText.trim()}>
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
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.profileBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.profileContent}>
            <View style={styles.profileAvatarWrap}>
              <Avatar uri={user?.imageUrl || user?.profileImage} name={user?.name || user?.firstName} size={56} />
            </View>
            <Text style={styles.profileName}>{userLoading ? '...' : (user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Mentor')}</Text>
            <Text style={styles.profileHeadline}>{user?.headline || 'Mentor'}</Text>
            
            {/* Stats Grid for Mentor */}
            <View style={styles.statsGrid}>
              {statCards.map((s) => (
                <View key={s.label} style={[styles.statItem, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon} size={16} color={s.color} />
                  <View>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Create Post */}
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

        {/* Mentor Widgets (Upcoming & Pending) */}
        {requests.length > 0 && (
          <View style={styles.widgetSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.widgetTitle}>Pending Requests</Text>
              <Badge label={String(requests.length)} variant="warning" size="sm" />
            </View>
            {requests.map((req, i) => (
              <Card key={req._id || i} style={styles.reqCard} elevated>
                <View style={styles.reqRow}>
                  <Avatar uri={req.sender?.profileImage} name={req.sender?.name || req.sender?.firstName} size={40} />
                  <View style={styles.reqInfo}>
                    <Text style={styles.reqName}>{req.sender?.name ? req.sender.name : req.sender?.firstName ? `${req.sender.firstName} ${req.sender.lastName || ''}`.trim() : 'Student'}</Text>
                    <Text style={styles.reqMeta}>{req.sender?.headline || 'Student'}</Text>
                  </View>
                  <View style={styles.reqActions}>
                    <TouchableOpacity style={styles.acceptBtn}><Ionicons name="checkmark" size={16} color={Colors.success} /></TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn}><Ionicons name="close" size={16} color={Colors.error} /></TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {sessions.length > 0 && (
          <View style={styles.widgetSection}>
            <Text style={styles.widgetTitle}>Upcoming Sessions</Text>
            {sessions.map((sess, i) => {
              const date = sess.date ? new Date(sess.date) : null;
              return (
                <Card key={sess._id || i} style={styles.sessCard} elevated>
                  <View style={styles.sessRow}>
                    <Avatar uri={sess.student?.profileImage} name={sess.student?.name || sess.student?.firstName} size={40} />
                    <View style={styles.sessInfo}>
                      <Text style={styles.sessName}>{sess.student?.name ? sess.student.name : sess.student?.firstName ? `${sess.student.firstName} ${sess.student.lastName || ''}`.trim() : 'Student'}</Text>
                      <Text style={styles.sessTime}>{date ? `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}</Text>
                    </View>
                    <TouchableOpacity style={styles.joinBtn}>
                      <LinearGradient colors={Colors.gradientPrimary} style={styles.joinGrad}>
                        <Ionicons name="videocam" size={16} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Feed Posts */}
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, width: '100%', borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: 16 },
  statItem: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8 },
  statValue: { fontSize: FontSize.md, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textMuted },

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
    ...Shadow.md 
  },
  postButtonDisabled: { opacity: 0.5, borderBottomWidth: 0, marginTop: 3 },
  postButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800', letterSpacing: 0.5 },

  // Widgets
  widgetSection: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  widgetTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, paddingLeft: 4 },
  reqCard: { padding: 12, marginBottom: 8, borderRadius: 0 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reqInfo: { flex: 1 },
  reqName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  reqMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  reqActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.successBg, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.errorBg, justifyContent: 'center', alignItems: 'center' },
  sessCard: { padding: 12, marginBottom: 8, borderRadius: 0 },
  sessRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessInfo: { flex: 1 },
  sessName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  sessTime: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  joinGrad: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Post Card
  postCard: { marginTop: 8, borderRadius: 0 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  postAuthorInfo: { flex: 1 },
  postAuthorName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  postAuthorRole: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize', marginTop: 1 },
  postTime: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  postContent: { fontSize: FontSize.md, color: 'rgba(241,245,249,0.9)', lineHeight: 22, marginBottom: 12 },
  gradientPost: { borderRadius: BorderRadius.md, minHeight: 180, justifyContent: 'center', alignItems: 'center', padding: 20, marginBottom: 12 },
  gradientPostText: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  postImage: { width: '100%', height: 220, borderRadius: BorderRadius.md, marginBottom: 12, backgroundColor: Colors.surface },
  eventCard: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, padding: 12, marginBottom: 12 },
  eventIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.1)', justifyContent: 'center', alignItems: 'center' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  engagementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  engagementLeft: { flexDirection: 'row', alignItems: 'center' },
  likeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  engagementText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  postDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginBottom: 8 },
  commentsDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginBottom: 12 },
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
  commentInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.surfaceBorder },

  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  emptyCard: { marginTop: 8, alignItems: 'center', paddingVertical: 32, gap: 8, borderRadius: 0 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
