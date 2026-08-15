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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSignIn, useOAuth } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors, FontSize, Spacing } from '../../theme/colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate() || !isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/dashboard', { scheme: 'campusbridge' }),
      });
      if (createdSessionId) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error', err);
      Alert.alert('Google Auth Failed', err?.errors?.[0]?.longMessage || err?.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      {/* Background glow */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={Colors.gradientPrimary}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>CB</Text>
            </LinearGradient>
            <Text style={styles.appName}>CampusBridge</Text>
            <Text style={styles.tagline}>Connecting Campus to Careers</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                error={errors.email}
                icon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
              />

              <View style={styles.fieldSpacing} />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <Button
                title={loading ? 'Signing in...' : 'Sign In'}
                onPress={handleLogin}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleAuth}>
              <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
              <Text style={styles.googleBtnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.signupText}>
                Don't have an account?{' '}
                <Text style={styles.signupBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  glow1: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  glow2: {
    position: 'absolute',
    bottom: 80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  form: { gap: 4 },
  fieldSpacing: { height: 8 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 16 },
  forgotText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '500' },
  submitBtn: { marginTop: 4 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.surfaceBorder },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    gap: 8,
    marginBottom: Spacing.md,
  },
  googleBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  signupLink: { alignItems: 'center', marginTop: 4 },
  signupText: { color: Colors.textSecondary, fontSize: FontSize.md },
  signupBold: { color: Colors.primaryLight, fontWeight: '700' },
});
