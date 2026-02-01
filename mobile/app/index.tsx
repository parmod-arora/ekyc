// Index/Entry point - redirects based on auth state

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../src/theme';

export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const init = async () => {
      await initialize();
      
      // Redirect based on auth status
      if (status === 'logged_in') {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    };

    init();
  }, []);

  // Show loading while initializing
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
