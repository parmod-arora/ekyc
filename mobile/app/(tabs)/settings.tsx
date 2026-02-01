// Settings Screen

import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useTheme } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
          Appearance
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Ionicons name="moon-outline" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Toggle between light and dark theme
              </Text>
            </View>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, marginTop: spacing.md }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
          Account
        </Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.settingContent}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[typography.bodyBold, { color: colors.error, marginLeft: spacing.md }]}>
              Logout
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
});
