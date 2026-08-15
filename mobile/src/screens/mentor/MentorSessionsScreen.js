import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';

import { Colors, FontSize, Spacing, BorderRadius } from '../../theme/colors';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import apiClient from '../../api/client';

export default function MentorSessionsScreen() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'completed'

  const fetchSessions = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/sessions/mentor', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data?.sessions || res.data || []);
    } catch (e) {
      console.error('Sessions fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  const onRefresh = async () => { setRefreshing(true); await fetchSessions(); setRefreshing(false); };

  const filtered = sessions.filter((s) => {
    if (tab === 'upcoming') return s.status !== 'completed' && s.status !== 'cancelled';
    return s.status === 'completed';
  });

  const statusVariant = (status) => ({
    scheduled: 'info', completed: 'success', cancelled: 'error', pending: 'warning',
  }[status] || 'muted');

  const renderSession = ({ item }) => {
    const date = item.date ? new Date(item.date) : null;
    return (
      <Card style={styles.sessCard} elevated>
        <View style={styles.sessHeader}>
          <Avatar uri={item.student?.profileImage} name={item.student?.name} size={44} />
          <View style={styles.sessInfo}>
            <Text style={styles.sessName}>{item.student?.name || 'Student'}</Text>
            <Text style={styles.sessTime}>
              {date ? `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}
            </Text>
          </View>
          <Badge label={item.status || 'scheduled'} variant={statusVariant(item.status)} />
        </View>

        {item.topic && (
          <View style={styles.topicRow}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.topicText}>{item.topic}</Text>
          </View>
        )}

        {item.status !== 'completed' && (
          <View style={styles.sessionActions}>
            <TouchableOpacity style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.joinGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="videocam" size={16} color="#fff" />
                <Text style={styles.joinText}>Join</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>{filtered.length} {tab}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['upcoming', 'completed'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            {tab === t && <LinearGradient colors={Colors.gradientPrimary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
            <Text style={[styles.tabText, tab === t && { color: '#fff' }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No {tab} sessions</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 8 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', overflow: 'hidden' },
  tabActive: {},
  tabText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80, gap: 12 },
  sessCard: {},
  sessHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sessInfo: { flex: 1 },
  sessName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  sessTime: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  topicRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 12, paddingLeft: 4 },
  topicText: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
  sessionActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.error, alignItems: 'center' },
  cancelText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
  joinBtn: { flex: 2, borderRadius: 10, overflow: 'hidden' },
  joinGrad: { flexDirection: 'row', gap: 6, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  joinText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  loadingText: { color: Colors.textMuted },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
});
