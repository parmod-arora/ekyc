// Home Screen

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useVerificationStore } from '../../src/store/verificationStore';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const user = useAuthStore((state) => state.user);
  const { status, loading, error, fetchStatus, clearError } = useVerificationStore();
  const hasStartedOnboarding = useOnboardingStore((state) => state.hasStartedOnboarding);

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = () => {
    fetchStatus();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return colors.success;
      case 'REJECTED':
        return colors.error;
      case 'IN_PROGRESS':
      case 'MANUAL_REVIEW':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'MANUAL_REVIEW':
        return 'Manual Review';
      default:
        return status;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text }]}>Welcome</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {user?.fullName || user?.email || 'User'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
          Verification Status
        </Text>

        {loading && !status ? (
          <Text style={[typography.body, { color: colors.textSecondary }]}>Loading...</Text>
        ) : error ? (
          <View>
            <Text style={[typography.body, { color: colors.error, marginBottom: spacing.sm }]}>
              {error}
            </Text>
            <Button title="Retry" onPress={handleRefresh} variant="outline" />
          </View>
        ) : status ? (
          <View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(status.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    typography.bodyBold,
                    { color: getStatusColor(status.status) },
                  ]}
                >
                  {getStatusLabel(status.status)}
                </Text>
              </View>
            </View>
            {status.details.reasons.length > 0 && (
              <View style={styles.reasonsContainer}>
                <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.xs }]}>
                  Reasons:
                </Text>
                {status.details.reasons.map((reason, index) => (
                  <Text
                    key={index}
                    style={[typography.caption, { color: colors.textSecondary }]}
                  >
                    • {reason}
                  </Text>
                ))}
              </View>
            )}
            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: spacing.sm },
              ]}
            >
              Last updated: {new Date(status.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            No status available
          </Text>
        )}
      </View>

      {/* Only show onboarding action if status is NOT_STARTED or no status */}
      {(status?.status === 'NOT_STARTED' || !status) && (
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/onboarding')}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <View style={styles.actionContent}>
            <Text style={[typography.bodyBold, { color: colors.text }]}>
              {hasStartedOnboarding ? 'Resume Onboarding' : 'Start Onboarding'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Complete your verification process
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
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
  header: {
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  reasonsContainer: {
    marginTop: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
});
