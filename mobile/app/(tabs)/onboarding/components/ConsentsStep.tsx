// Consents Step Component

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '../../../../src/store/onboardingStore';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/Button';
import { Ionicons } from '@expo/vector-icons';

interface ConsentsStepProps {
  onNext: (showErrors?: boolean) => void;
  onPrevious?: () => void;
}

export const ConsentsStep: React.FC<ConsentsStepProps> = ({
  onNext,
  onPrevious,
}) => {
  const { colors, spacing, typography } = useTheme();
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [isValid, setIsValid] = useState(false);

  // Validate immediately on mount
  useEffect(() => {
    const valid = draft?.consents?.termsAccepted || false;
    setIsValid(valid);
  }, []);

  // Validate whenever data changes
  useEffect(() => {
    const valid = draft?.consents?.termsAccepted || false;
    setIsValid(valid);
  }, [draft?.consents?.termsAccepted]);

  const handleNext = () => {
    if (isValid) {
      onNext(false);
    } else {
      onNext(true); // Tell parent to show errors
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>
          Terms & Conditions
        </Text>

        <View style={[styles.consentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.body, { color: colors.text, marginBottom: spacing.md }]}>
            By proceeding, you agree to our Terms of Service and Privacy Policy. You confirm that
            all information provided is accurate and complete.
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            Your data will be processed securely and used solely for verification purposes.
          </Text>
        </View>

        <View style={styles.checkboxRow}>
          <Ionicons
            name={draft?.consents?.termsAccepted ? 'checkbox' : 'checkbox-outline'}
            size={24}
            color={draft?.consents?.termsAccepted ? colors.primary : colors.border}
            onPress={() =>
              updateDraft({ consents: { termsAccepted: !(draft?.consents?.termsAccepted || false) } })
            }
          />
          <Text
            style={[typography.body, { color: colors.text, marginLeft: spacing.sm, flex: 1 }]}
            onPress={() =>
              updateDraft({ consents: { termsAccepted: !(draft?.consents?.termsAccepted || false) } })
            }
          >
            I accept the terms and conditions
          </Text>
        </View>
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
            title="Next"
            onPress={handleNext}
            disabled={!isValid}
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
  consentBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
