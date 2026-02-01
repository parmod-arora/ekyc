// Review Step Component

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../../../src/store/onboardingStore';
import { useVerificationStore } from '../../../../src/store/verificationStore';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/Button';

interface ReviewStepProps {
  onPrevious?: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  onPrevious,
}) => {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const draft = useOnboardingStore((state) => state.draft);
  const submissionState = useOnboardingStore((state) => state.submissionState);
  const submissionError = useOnboardingStore((state) => state.submissionError);
  const submit = useOnboardingStore((state) => state.submit);
  const fetchStatus = useVerificationStore((state) => state.fetchStatus);
  const clearOnboardingStarted = useOnboardingStore((state) => state.clearOnboardingStarted);

  useEffect(() => {
    if (submissionState === 'success') {
      clearOnboardingStarted();
      Alert.alert('Success', 'Your onboarding has been submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            fetchStatus();
            router.push('/(tabs)/home');
          },
        },
      ]);
    }
  }, [submissionState, fetchStatus, router, clearOnboardingStarted]);

  const handleSubmit = async () => {
    if (!draft?.consents?.termsAccepted) {
      Alert.alert('Required', 'Please accept the terms and conditions to continue');
      return;
    }

    try {
      await submit();
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>
          Review & Submit
        </Text>

        <View style={[styles.reviewSection, { backgroundColor: colors.surface }]}>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>
            Profile
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Name: {draft?.profile.fullName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            DOB: {draft?.profile.dateOfBirth}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Nationality: {draft?.profile.nationality}
          </Text>
        </View>

        <View style={[styles.reviewSection, { backgroundColor: colors.surface }]}>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>
            Document
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Type: {draft?.document.documentType}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Number: {draft?.document.documentNumber}
          </Text>
        </View>

        <View style={[styles.reviewSection, { backgroundColor: colors.surface }]}>
          <Text style={[typography.bodyBold, { color: colors.text, marginBottom: spacing.sm }]}>
            Address
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {draft?.address.addressLine1}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {draft?.address.city}, {draft?.address.country}
          </Text>
        </View>

        {submissionError && (
          <View style={styles.errorContainer}>
            <Text style={[typography.caption, { color: colors.error }]}>{submissionError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.buttonRow}>
          {onPrevious && (
            <Button
              title="Previous"
              onPress={onPrevious}
              variant="outline"
              style={styles.footerButton}
            />
          )}
          <Button
            title={submissionState === 'submitting' ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            loading={submissionState === 'submitting'}
            disabled={submissionState === 'submitting' || !draft?.consents?.termsAccepted}
            style={[styles.footerButton, { flex: 1 }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  reviewSection: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorContainer: {
    padding: 16,
    marginTop: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    minWidth: 100,
  },
});
