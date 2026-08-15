import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      const { View, Text, StyleSheet } = require('react-native');
      return (
        <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>⚠️ Startup Error</Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppWithClerk() {
  // Platform-aware token cache
  const tokenCache = Platform.OS === 'web'
    ? {
        async getToken(key) { try { return localStorage.getItem(key); } catch { return null; } },
        async saveToken(key, value) { try { localStorage.setItem(key, value); } catch {} },
        async clearToken(key) { try { localStorage.removeItem(key); } catch {} },
      }
    : (() => {
        const SecureStore = require('expo-secure-store');
        return {
          async getToken(key) { try { return await SecureStore.getItemAsync(key); } catch { return null; } },
          async saveToken(key, value) { try { await SecureStore.setItemAsync(key, value); } catch {} },
          async clearToken(key) { try { await SecureStore.deleteItemAsync(key); } catch {} },
        };
      })();

  const { ClerkProvider } = require('@clerk/expo');
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppWithClerk />
    </ErrorBoundary>
  );
}
