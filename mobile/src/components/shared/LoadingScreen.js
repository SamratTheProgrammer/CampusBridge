import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  spinner: {
    marginTop: 8,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
