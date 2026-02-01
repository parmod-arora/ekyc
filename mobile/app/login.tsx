// Login Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useTheme } from '../src/theme';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  
  // Check if user was redirected due to session expiry
  const isExpired = status === 'expired';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    clearError();

    // Validation
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) return;

    try {
      await login(email.trim(), password);
      // Clear any expired status on successful login
      clearError();
      router.replace('/(tabs)/home');
    } catch (err: any) {
      // Error is handled by the store
      if (err.response?.data?.error?.code === 'INVALID_CREDENTIALS') {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.xs }]}>
            Welcome
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, marginBottom: spacing.xl },
            ]}
          >
            Sign in to continue
          </Text>

          {isExpired && (
            <View style={[styles.messageBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <Text style={[typography.caption, { color: colors.warning }]}>
                Your session has expired. Please login again.
              </Text>
            </View>
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            placeholder="jane.doe@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={emailError}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            error={passwordError}
          />

          {error && (
            <Text style={[typography.caption, { color: colors.error, marginBottom: spacing.md }]}>
              {error}
            </Text>
          )}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={status === 'logging_in'}
            disabled={status === 'logging_in'}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
});
