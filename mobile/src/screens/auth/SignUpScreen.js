import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSignUp } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors, FontSize, Spacing } from '../../theme/colors';

const ROLES = [
  { key: 'student', label: 'Student', icon: 'school-outline', desc: 'Discover jobs, events & mentors' },
  { key: 'alumni', label: 'Alumni', icon: 'ribbon-outline', desc: 'Give back & post opportunities' },
  { key: 'mentor', label: 'Mentor', icon: 'people-outline', desc: 'Guide and mentor students' },
];

export default function SignUpScreen({ navigation }) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [step, setStep] = useState(1); // 1: details, 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (!password || password.length < 8) errs.password = 'At least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate() || !isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || ' ',
        emailAddress: email.trim(),
        password,
        unsafeMetadata: { role },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep(2);
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || 'Sign up failed. Try again.';
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim() || !isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp.trim() });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      Alert.alert('Verification Failed', 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.navigate('Login')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.logoSmall} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoSmallText}>CB</Text>
            </LinearGradient>
          </View>

          <Text style={styles.title}>{step === 1 ? 'Create Account' : 'Verify Email'}</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Join the CampusBridge community' : `We sent a code to ${email}`}
          </Text>

          {step === 1 ? (
            <View style={styles.card}>
              {/* Role selector */}
              <Text style={styles.sectionLabel}>I am a...</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => setRole(r.key)}
                    style={[styles.roleCard, role === r.key && styles.roleCardActive]}
                    activeOpacity={0.8}
                  >
                    {role === r.key && (
                      <LinearGradient colors={Colors.gradientPrimary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                    )}
                    <Ionicons name={r.icon} size={24} color={role === r.key ? '#fff' : Colors.textMuted} />
                    <Text style={[styles.roleLabel, role === r.key && { color: '#fff' }]}>{r.label}</Text>
                    <Text style={[styles.roleDesc, role === r.key && { color: 'rgba(255,255,255,0.7)' }]}>{r.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formSection}>
                <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} error={errors.name}
                  icon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />} />
                <View style={{ height: 12 }} />
                <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail}
                  keyboardType="email-address" error={errors.email}
                  icon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />} />
                <View style={{ height: 12 }} />
                <Input label="Password" placeholder="Min. 8 characters" value={password} onChangeText={setPassword}
                  secureTextEntry error={errors.password}
                  icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />} />
                <View style={{ height: 16 }} />
                <Button title={loading ? 'Creating Account...' : 'Create Account'} onPress={handleSignUp} loading={loading} />
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.otpIconContainer}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.otpIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="mail" size={32} color="#fff" />
                </LinearGradient>
              </View>
              <Input label="Verification Code" placeholder="Enter 6-digit code" value={otp} onChangeText={setOtp}
                keyboardType="number-pad" icon={<Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} />} />
              <View style={{ height: 16 }} />
              <Button title={loading ? 'Verifying...' : 'Verify & Continue'} onPress={handleVerify} loading={loading} />
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  glow1: { position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(99,102,241,0.12)' },
  glow2: { position: 'absolute', bottom: 100, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(168,85,247,0.1)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  backBtn: { padding: 8 },
  logoSmall: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  logoSmallText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  card: { backgroundColor: Colors.card, borderRadius: 24, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
  sectionLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleGrid: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  roleCard: {
    flex: 1, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface, alignItems: 'center', gap: 4, overflow: 'hidden',
  },
  roleCardActive: { borderColor: Colors.primary },
  roleLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  roleDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 14 },
  formSection: { marginTop: 4 },
  otpIconContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  otpIcon: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textSecondary, fontSize: FontSize.md },
  loginBold: { color: Colors.primaryLight, fontWeight: '700' },
});
