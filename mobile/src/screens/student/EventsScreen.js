import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';

import { Colors, FontSize, Spacing, BorderRadius } from '../../theme/colors';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import apiClient from '../../api/client';

export default function EventsScreen() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const modes = ['All', 'Online', 'Offline', 'Hybrid'];

  const fetchEvents = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data?.events || res.data || []);
    } catch (e) {
      console.error('Events fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const onRefresh = async () => { setRefreshing(true); await fetchEvents(); setRefreshing(false); };

  const filtered = events.filter((e) => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || e.mode === filter;
    return matchSearch && matchFilter;
  });

  const modeVariant = (mode) => ({ Online: 'info', Offline: 'warning', Hybrid: 'purple' }[mode] || 'muted');

  const renderEvent = ({ item }) => {
    const date = item.date ? new Date(item.date) : null;
    return (
      <Card style={styles.eventCard} elevated>
        <LinearGradient colors={['rgba(99,102,241,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={styles.eventRow}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{date ? date.getDate() : '--'}</Text>
            <Text style={styles.dateMonth}>{date ? date.toLocaleString('default', { month: 'short' }).toUpperCase() : '---'}</Text>
          </View>
          <View style={styles.eventContent}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
              <Badge label={item.mode || 'Online'} variant={modeVariant(item.mode)} />
            </View>
            <Text style={styles.organizer}>by {item.organizer?.firstName ? `${item.organizer.firstName} ${item.organizer.lastName || ''}`.trim() : 'CampusBridge'}</Text>
            {item.description && (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.eventFooter}>
              <View style={styles.metaRow}>
                {item.venue && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.venue}</Text>
                  </View>
                )}
                {date && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                )}
              </View>
              <Button title="Register" size="sm" fullWidth={false} />
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>{filtered.length} upcoming</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={Colors.primary}
          />
        </View>
      </View>

      <View style={styles.filtersWrap}>
        <FlatList
          data={modes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[styles.chip, filter === item && styles.chipActive]}
              activeOpacity={0.8}
            >
              {filter === item && (
                <LinearGradient colors={['#a855f7', '#6366f1']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              )}
              <Text style={[styles.chipText, filter === item && { color: '#fff' }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptyText}>Check back soon!</Text>
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
  searchContainer: { paddingHorizontal: Spacing.lg, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    paddingHorizontal: 12, height: 48,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  filtersWrap: { marginBottom: 12 },
  filtersList: { paddingHorizontal: Spacing.lg, gap: 8 },
  chip: {
    paddingVertical: 7, paddingHorizontal: 18, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  chipActive: { borderColor: Colors.secondary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80, gap: 12 },
  eventCard: { overflow: 'hidden' },
  eventRow: { flexDirection: 'row', gap: 14 },
  dateBox: {
    width: 54, height: 54, backgroundColor: Colors.secondary, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  dateDay: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },
  dateMonth: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  eventContent: { flex: 1 },
  eventTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  eventTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  organizer: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  desc: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 18, marginBottom: 8 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'column', gap: 3 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  loadingText: { color: Colors.textMuted },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
