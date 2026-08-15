import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
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
import Button from '../../components/ui/Button';
import apiClient from '../../api/client';

export default function MentorDirectoryScreen() {
  const { getToken } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchMentors = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/users/mentors/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMentors(res.data?.mentors || res.data || []);
    } catch (e) {
      console.error('Mentors fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const onRefresh = async () => { setRefreshing(true); await fetchMentors(); setRefreshing(false); };

  const filtered = mentors.filter((m) =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.currentPosition?.toLowerCase().includes(search.toLowerCase()) ||
    m.skills?.some((s) => s?.toLowerCase().includes(search.toLowerCase()))
  );

  const renderMentor = ({ item }) => (
    <Card style={styles.mentorCard} elevated>
      <LinearGradient colors={['rgba(168,85,247,0.06)', 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={styles.mentorHeader}>
        <Avatar uri={item.profileImage} name={item.name} size={56} />
        <View style={styles.mentorInfo}>
          <Text style={styles.mentorName}>{item.name}</Text>
          <Text style={styles.mentorRole} numberOfLines={1}>{item.currentPosition || 'Professional'}</Text>
          <Text style={styles.mentorCompany} numberOfLines={1}>{item.currentCompany || ''}</Text>
        </View>
        {item.isAvailable !== false && <Badge label="Available" variant="success" />}
      </View>
      {item.skills?.length > 0 && (
        <View style={styles.skills}>
          {item.skills.slice(0, 3).map((s, i) => (
            <Badge key={i} label={s} variant="muted" />
          ))}
          {item.skills.length > 3 && (
            <Badge label={`+${item.skills.length - 3}`} variant="primary" />
          )}
        </View>
      )}
      <View style={styles.mentorStats}>
        {item.sessionsCount !== undefined && (
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.statText}>{item.sessionsCount} sessions</Text>
          </View>
        )}
        {item.rating !== undefined && (
          <View style={styles.stat}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.statText}>{item.rating?.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <Button title="View Profile" variant="outline" size="sm" fullWidth={false} style={{ flex: 1 }} />
        <Button title="Book Session" size="sm" fullWidth={false} style={{ flex: 1 }} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Find a Mentor</Text>
        <Text style={styles.subtitle}>{filtered.length} mentors available</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, role or skill..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={Colors.primary}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Finding mentors...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderMentor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No mentors found</Text>
              <Text style={styles.emptyText}>Try a different search</Text>
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
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    paddingHorizontal: 12, height: 48,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80, gap: 14 },
  mentorCard: { overflow: 'hidden' },
  mentorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  mentorInfo: { flex: 1 },
  mentorName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  mentorRole: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
  mentorCompany: { fontSize: FontSize.xs, color: Colors.textMuted },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  mentorStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  loadingText: { color: Colors.textMuted },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
