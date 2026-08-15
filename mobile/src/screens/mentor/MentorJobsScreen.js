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
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import apiClient from '../../api/client';

export default function MentorJobsScreen() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('posted'); // 'posted' | 'browse'
  const [browseJobs, setBrowseJobs] = useState([]);

  const fetchJobs = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [postedRes, browseRes] = await Promise.allSettled([
        apiClient.get('/api/jobs/my', { headers }),
        apiClient.get('/api/jobs?limit=20', { headers }),
      ]);
      if (postedRes.status === 'fulfilled') setJobs(postedRes.value.data?.jobs || postedRes.value.data || []);
      if (browseRes.status === 'fulfilled') setBrowseJobs(browseRes.value.data?.jobs || browseRes.value.data || []);
    } catch (e) {
      console.error('Mentor jobs fetch error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  const onRefresh = async () => { setRefreshing(true); await fetchJobs(); setRefreshing(false); };

  const renderJob = ({ item }) => (
    <Card style={styles.jobCard} elevated>
      <View style={styles.jobHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyInitial}>{item.company?.[0] || 'C'}</Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.jobCompany}>{item.company}</Text>
        </View>
        {tab === 'posted' && (
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.tags}>
        <Badge label={item.type || 'Full-time'} variant="primary" />
        {item.location && <Badge label={item.location} variant="muted" />}
        {item.applications && <Badge label={`${item.applications} applicants`} variant="info" />}
      </View>
      {tab === 'posted' ? (
        <View style={styles.actions}>
          <Button title="View Applications" variant="outline" size="sm" />
          <Button title="Close Job" variant="ghost" size="sm" />
        </View>
      ) : null}
    </Card>
  );

  const currentData = tab === 'posted' ? jobs : browseJobs;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
        <Button title="Post Job" size="sm" fullWidth={false} icon={<Ionicons name="add" size={16} color="#fff" />} />
      </View>

      <View style={styles.tabs}>
        {['posted', 'browse'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            {tab === t && <LinearGradient colors={Colors.gradientPrimary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
            <Ionicons name={t === 'posted' ? 'briefcase' : 'search'} size={14} color={tab === t ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, tab === t && { color: '#fff' }]}>
              {t === 'posted' ? 'My Posts' : 'Browse All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>{tab === 'posted' ? 'No jobs posted yet' : 'No jobs available'}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  tabText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80, gap: 12 },
  jobCard: {},
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  companyLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.15)', justifyContent: 'center', alignItems: 'center' },
  companyInitial: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  jobCompany: { fontSize: FontSize.sm, color: Colors.textSecondary },
  editBtn: { padding: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  actions: { gap: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
});
