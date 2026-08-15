import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useClerk } from '@clerk/expo';

import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../theme/colors';
import { useUser } from '../../hooks/useUser';
import apiClient from '../../api/client';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function ProfileScreen() {
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { user, loading, refetch } = useUser();

  // Settings State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [isAlumni, setIsAlumni] = useState(user?.role === 'alumni');

  React.useEffect(() => {
    if (user) {
      setIsAlumni(user.role === 'alumni');
    }
  }, [user]);

  const handleAlumniToggle = async (value) => {
    setIsAlumni(value);
    const newRole = value ? 'alumni' : 'student';
    try {
      const token = await getToken();
      await apiClient.put(`/api/users/${user.clerkId}/profile`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (refetch) refetch();
    } catch (error) {
      console.error('Failed to update role', error);
      setIsAlumni(!value);
      Alert.alert('Error', 'Failed to update alumni status');
    }
  };
  
  // Edit Profile State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const saveProfile = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    }, 1000);
  };

  const renderSettingToggle = (icon, label, color, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconBox, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        trackColor={{ false: Colors.surfaceBorder, true: Colors.secondaryDark }}
        thumbColor={value ? Colors.secondary : '#f4f3f4'}
        ios_backgroundColor={Colors.surfaceBorder}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.profileBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.profileContent}>
            <View style={styles.avatarWrapper}>
              <Avatar uri={user?.profileImage || user?.imageUrl} name={user?.name || user?.firstName} size={90} />
              <TouchableOpacity style={styles.editAvatar}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.editAvatarGrad}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Student'}</Text>
            <Text style={styles.email}>{user?.email || 'student@example.com'}</Text>
            
            <View style={styles.badges}>
              <Badge label={user?.role || 'Student'} variant="primary" />
              {user?.college && <Badge label={user.college} variant="muted" />}
              <Badge label="Verified" variant="success" icon={<Ionicons name="checkmark-circle" size={12} color={Colors.success} />} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user?.applicationsCount || 0}</Text>
                <Text style={styles.statLabel}>Applications</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{user?.connectionsCount || 0}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editProfileBtn}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Dynamic Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <Card style={styles.settingsCard}>
            {renderSettingToggle('school-outline', 'Alumni Status', Colors.primary, isAlumni, handleAlumniToggle)}
            <View style={styles.divider} />
            {renderSettingToggle('notifications-outline', 'Push Notifications', Colors.primary, pushNotifications, setPushNotifications)}
            <View style={styles.divider} />
            {renderSettingToggle('mail-outline', 'Email Updates', Colors.secondary, emailAlerts, setEmailAlerts)}
            <View style={styles.divider} />
            {renderSettingToggle('briefcase-outline', 'Job Alerts', Colors.accent, jobAlerts, setJobAlerts)}
            <View style={styles.divider} />
            {renderSettingToggle('lock-closed-outline', 'Private Profile', Colors.warning, privateProfile, setPrivateProfile)}
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.settingsCard}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: `${Colors.info}20` }]}>
                  <Ionicons name="help-circle-outline" size={20} color={Colors.info} />
                </View>
                <Text style={styles.settingLabel}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionItem} onPress={handleSignOut}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: `${Colors.error}20` }]}>
                  <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                </View>
                <Text style={[styles.settingLabel, { color: Colors.error }]}>Sign Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.textInput}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Write a short bio..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            
            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 24 },
  
  // Profile Card (edge-to-edge)
  profileCard: { marginTop: 0, padding: 0, overflow: 'hidden', borderRadius: 0 },
  profileBanner: { height: 100 },
  profileContent: { alignItems: 'center', paddingBottom: 24, paddingHorizontal: 16 },
  avatarWrapper: { marginTop: -45, marginBottom: 12, borderRadius: 45, borderWidth: 4, borderColor: Colors.card, overflow: 'hidden', position: 'relative' },
  editAvatar: { position: 'absolute', bottom: 0, right: 0 },
  editAvatarGrad: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.card },
  name: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  
  // Stats
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, paddingTop: 16, marginBottom: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.surfaceBorder },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },

  // Edit Button (3D Purple)
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 3, borderBottomColor: Colors.secondaryDark,
    ...Shadow.md,
  },
  editProfileText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800', letterSpacing: 0.5 },

  // Settings
  section: { marginTop: 24 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, paddingHorizontal: Spacing.md },
  settingsCard: { borderRadius: 0, paddingVertical: 8, paddingHorizontal: 0 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.md },
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.md },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 64 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  textInput: {
    backgroundColor: Colors.inputBg, color: Colors.inputText, fontSize: FontSize.md,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.inputBorder,
    padding: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 24
  },
  saveBtn: {
    backgroundColor: Colors.secondary, padding: 16, borderRadius: BorderRadius.md,
    alignItems: 'center', borderBottomWidth: 3, borderBottomColor: Colors.secondaryDark,
  },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});
