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

export default function JobsScreen() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Full-time', 'Part-time', 'Internship', 'Remote'];

  const fetchJobs = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await apiClient.get('/api/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data?.jobs || res.data || []);
    } catch (e) {
      console.error('Jobs fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const onRefresh = async () => { setRefreshing(true); await fetchJobs(); setRefreshing(false); };

  const filtered = jobs.filter((j) => {
    const matchSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.company?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || j.type === filter;
    return matchSearch && matchFilter;
  });

  const renderJob = ({ item }) => (
    <Card style={styles.jobCard} elevated>
      <View style={styles.jobHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyInitial}>{item.company?.[0] || 'C'}</Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.jobCompany}>{item.company}</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn}>
          <Ionicons name="bookmark-outline" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={styles.tags}>
        {item.type && <Badge label={item.type} variant="primary" />}
        {item.location && <Badge label={item.location} variant="muted" />}
        {item.salary && <Badge label={item.salary} variant="success" />}
      </View>
      {item.description && (
        <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>
      )}
      <View style={styles.jobFooter}>
        <Text style={styles.postedDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
        </Text>
        <Button title="Apply Now" size="sm" fullWidth={false} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Job Board</Text>
        <Text style={styles.subtitle}>{filtered.length} opportunities</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs or companies..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            selectionColor={Colors.primary}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              {filter === item && (
                <LinearGradient colors={Colors.gradientPrimary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              )}
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
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
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  filtersContainer: { marginBottom: 12 },
  filtersList: { paddingHorizontal: Spacing.lg, gap: 8 },
  filterChip: {
    paddingVertical: 7, paddingHorizontal: 16, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  filterChipActive: { borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80, gap: 12 },
  jobCard: {},
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  companyLogo: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
  },
  companyInitial: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  jobCompany: { fontSize: FontSize.sm, color: Colors.textSecondary },
  saveBtn: { padding: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  jobDesc: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20, marginBottom: 12 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postedDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  loadingText: { color: Colors.textMuted, marginTop: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
