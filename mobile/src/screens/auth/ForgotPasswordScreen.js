import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert
} from 'react-native';
import { useSignIn } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors, FontSize, Spacing } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const { signIn, isLoaded } = useSignIn();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim() || !isLoaded) return;
    setLoading(true);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email.trim() });
      setStep(2);
    } catch (err) {
      Alert.alert('Error', err?.errors?.[0]?.longMessage || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code.trim() || !newPassword || !isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPassword,
      });
      if (result.status === 'complete') {
        Alert.alert('Success', 'Password reset! Please login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err?.errors?.[0]?.longMessage || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="key" size={36} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? "Enter your email and we'll send a reset code" : `Enter the code sent to ${email}`}
          </Text>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Input label="Email Address" placeholder="you@example.com" value={email} onChangeText={setEmail}
                  keyboardType="email-address" icon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />} />
                <View style={{ height: 16 }} />
                <Button title={loading ? 'Sending...' : 'Send Reset Code'} onPress={handleSendCode} loading={loading} />
              </>
            ) : (
              <>
                <Input label="Reset Code" placeholder="Enter 6-digit code" value={code} onChangeText={setCode}
                  keyboardType="number-pad" icon={<Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} />} />
                <View style={{ height: 12 }} />
                <Input label="New Password" placeholder="Min. 8 characters" value={newPassword} onChangeText={setNewPassword}
                  secureTextEntry icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />} />
                <View style={{ height: 16 }} />
                <Button title={loading ? 'Resetting...' : 'Reset Password'} onPress={handleReset} loading={loading} />
                <Button title="Resend Code" onPress={handleSendCode} variant="ghost" style={{ marginTop: 8 }} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xl },
  backText: { color: Colors.textSecondary, fontSize: FontSize.md },
  iconContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  icon: { width: 80, height: 80, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 22 },
  card: { backgroundColor: Colors.card, borderRadius: 24, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
});
