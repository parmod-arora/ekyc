// Root Layout with route guards and session management

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useTheme } from '../src/theme';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();
  const { status, initialize, checkSessionExpiry } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize auth state on app start
    const init = async () => {
      try {
        await initialize();
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    // Check session expiry periodically
    const interval = setInterval(() => {
      const isExpired = checkSessionExpiry();
      if (isExpired && segments[0] !== 'login') {
        router.replace('/login');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isInitializing, segments, checkSessionExpiry, router]);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === 'login';
    const isAuthenticated = status === 'logged_in';

    // Route guard logic
    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and trying to access protected route
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but on login page
      router.replace('/(tabs)/home');
    } else if (status === 'expired' && !inAuthGroup) {
      // Session expired, redirect to login immediately
      router.replace('/login');
    }
  }, [status, segments, isInitializing, router]);

  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colors.background === '#000000' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
