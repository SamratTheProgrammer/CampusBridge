import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Colors, FontSize, Spacing, BorderRadius } from '../../theme/colors';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import apiClient from '../../api/client';

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const GRADIENT_MAP = {
  'bg-gradient-to-r from-purple-500 to-indigo-500': ['#a855f7', '#6366f1'],
  'bg-gradient-to-r from-pink-500 to-rose-500': ['#ec4899', '#f43f5e'],
  'bg-gradient-to-r from-cyan-500 to-blue-500': ['#06b6d4', '#3b82f6'],
  'bg-gradient-to-r from-amber-500 to-orange-500': ['#f59e0b', '#f97316'],
  'bg-gradient-to-r from-emerald-500 to-teal-500': ['#10b981', '#14b8a6'],
};

export default function UserProfileScreen() {
  const { getToken, userId: currentUserId } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [userRes, postsRes, connRes] = await Promise.allSettled([
        apiClient.get(`/api/users/${userId}`, { headers }),
        apiClient.get(`/api/posts`, { headers }), // Ideally `/api/posts?authorClerkId=${userId}`
        apiClient.get(`/api/connections/user/${currentUserId}`, { headers })
      ]);

      if (userRes.status === 'fulfilled') {
        setProfileUser(userRes.value.data);
      }
      if (postsRes.status === 'fulfilled') {
        // Filter locally if backend doesn't support query param yet
        const userPosts = (postsRes.value.data || []).filter(p => p.authorClerkId === userId);
        setPosts(userPosts);
      }
      if (connRes.status === 'fulfilled') {
        const conns = connRes.value.data || [];
        const conn = conns.find(c => c.requesterClerkId === userId || c.recipientClerkId === userId);
        if (conn) {
          setConnectionStatus(conn.status); // 'pending' or 'accepted'
        }
      }
    } catch (e) {
      console.error('Fetch user error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, userId, currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleConnect = async () => {
    try {
      const token = await getToken();
      await apiClient.post('/api/connections', {
        requesterClerkId: currentUserId,
        recipientClerkId: userId,
        message: 'I would like to connect with you.',
      }, { headers: { Authorization: `Bearer ${token}` } });
      setConnectionStatus('pending');
    } catch (e) {
      console.error('Connect error:', e?.message);
    }
  };

  const renderPost = (post) => {
    const safeLikes = post.likes || [];
    const hasLiked = currentUserId && safeLikes.some(l => (l.clerkId || l) === currentUserId);
    const commentsCount = post.comments?.length || 0;
    const gradientColors = post.bgGradient ? GRADIENT_MAP[post.bgGradient] : null;

    return (
      <Card key={post._id} style={styles.postCard}>
        <View style={styles.postAuthorRow}>
          <Avatar uri={post.author?.image} name={post.author?.name} size={44} />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{post.author?.name || 'User'}</Text>
            <Text style={styles.postAuthorRole}>{post.author?.role || 'Member'}</Text>
            <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>

        {gradientColors ? (
          <LinearGradient colors={gradientColors} style={styles.gradientPost} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.gradientPostText}>{post.content}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.postContent}>{post.content}</Text>
        )}

        {post.imageUrl && !post.bgGradient && (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
        )}

        <View style={styles.postDivider} />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name={hasLiked ? 'heart' : 'heart-outline'} size={20} color={hasLiked ? '#ef4444' : Colors.textMuted} />
            <Text style={[styles.actionText, hasLiked && { color: '#ef4444' }]}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.actionText}>Comment {commentsCount > 0 && `(${commentsCount})`}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>User not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Nav */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{profileUser.firstName} {profileUser.lastName}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Card style={styles.profileCard}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.profileBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.profileContent}>
            <View style={styles.avatarWrapper}>
              <Avatar uri={profileUser.imageUrl || profileUser.profileImage} name={profileUser.firstName} size={90} />
            </View>
            <Text style={styles.name}>{profileUser.firstName} {profileUser.lastName}</Text>
            <Text style={styles.headline}>{profileUser.headline || profileUser.role || 'Member'}</Text>

            {currentUserId !== userId && (
              <View style={styles.actionButtons}>
                <Button 
                  title={connectionStatus === 'accepted' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Connect'}
                  variant={connectionStatus ? 'outline' : 'primary'}
                  icon={<Ionicons name={connectionStatus === 'accepted' ? 'checkmark' : 'person-add'} size={18} color={connectionStatus ? Colors.primary : "#fff"} />}
                  onPress={handleConnect}
                  disabled={!!connectionStatus}
                  style={styles.connectBtn}
                />
                <Button 
                  title="Message"
                  variant="outline"
                  icon={<Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />}
                  style={styles.messageBtn}
                />
              </View>
            )}

            {/* Profile Info Details */}
            <View style={styles.detailsContainer}>
              {profileUser.bio && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>About</Text>
                  <Text style={styles.detailText}>{profileUser.bio}</Text>
                </View>
              )}
              {profileUser.skills && profileUser.skills.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Skills</Text>
                  <View style={styles.badgesRow}>
                    {profileUser.skills.map((s, i) => <Badge key={i} label={s} variant="purple" />)}
                  </View>
                </View>
              )}
              {profileUser.education && profileUser.education.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Education</Text>
                  {profileUser.education.map((edu, i) => (
                    <View key={i} style={styles.eduItem}>
                      <Ionicons name="school-outline" size={18} color={Colors.textMuted} />
                      <View>
                        <Text style={styles.detailItemTitle}>{edu.institution}</Text>
                        <Text style={styles.detailItemSub}>{edu.degree}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* User's Feed */}
        <View style={styles.feedSection}>
          <Text style={styles.feedTitle}>Activity</Text>
          {posts.length > 0 ? (
            posts.map(renderPost)
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="newspaper-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
            </Card>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 24 },
  
  navHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  backBtn: { marginRight: 16 },
  navTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  profileCard: { marginTop: 0, padding: 0, overflow: 'hidden', borderRadius: 0 },
  profileBanner: { height: 100 },
  profileContent: { paddingBottom: 24, paddingHorizontal: 16 },
  avatarWrapper: { marginTop: -45, marginBottom: 12, borderRadius: 45, borderWidth: 4, borderColor: Colors.card, alignSelf: 'flex-start' },
  name: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary },
  headline: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  connectBtn: { flex: 1 },
  messageBtn: { flex: 1 },

  detailsContainer: { gap: 20 },
  detailSection: { borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: 16 },
  detailTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  detailText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eduItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailItemTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  detailItemSub: { fontSize: FontSize.sm, color: Colors.textSecondary },

  feedSection: { marginTop: 8 },
  feedTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, padding: 16, paddingBottom: 8 },

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
  postDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginBottom: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  actionText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  
  emptyCard: { marginTop: 8, alignItems: 'center', paddingVertical: 32, gap: 8, borderRadius: 0 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
});
