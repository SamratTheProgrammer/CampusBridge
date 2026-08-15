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
import apiClient from '../../api/client';

export default function MenteesScreen() {
  const { getToken } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchMentees = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/connections/mentees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMentees(res.data?.mentees || res.data || []);
    } catch (e) {
      console.error('Mentees fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchMentees(); }, [fetchMentees]);
  const onRefresh = async () => { setRefreshing(true); await fetchMentees(); setRefreshing(false); };

  const filtered = mentees.filter((m) =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderMentee = ({ item }) => (
    <Card style={styles.menteeCard} elevated>
      <View style={styles.menteeRow}>
        <Avatar uri={item.profileImage} name={item.name} size={52} />
        <View style={styles.menteeInfo}>
          <Text style={styles.menteeName}>{item.name}</Text>
          <Text style={styles.menteeCollege}>{item.college || 'Student'}</Text>
          <View style={styles.tags}>
            {item.skills?.slice(0, 2).map((s, i) => <Badge key={i} label={s} variant="muted" />)}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="calendar-outline" size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>My Mentees</Text>
        <Text style={styles.subtitle}>{filtered.length} mentees</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search mentees..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={Colors.primary}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading mentees...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderMentee}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No mentees yet</Text>
              <Text style={styles.emptyText}>Accept mentorship requests to start</Text>
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
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80, gap: 12 },
  menteeCard: {},
  menteeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menteeInfo: { flex: 1 },
  menteeName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  menteeCollege: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actions: { gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.surfaceBorder, justifyContent: 'center', alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  loadingText: { color: Colors.textMuted },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
