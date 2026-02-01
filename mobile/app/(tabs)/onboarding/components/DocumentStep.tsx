// Document Step Component

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '../../../../src/store/onboardingStore';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/Button';
import { Input } from '../../../../src/components/Input';

interface DocumentStepProps {
  onNext: (showErrors?: boolean) => void;
  onPrevious?: () => void;
  showErrors?: boolean;
}

export const DocumentStep: React.FC<DocumentStepProps> = ({
  onNext,
  onPrevious,
  showErrors = false,
}) => {
  const { colors, spacing, typography } = useTheme();
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!draft?.document?.documentNumber?.trim()) {
      newErrors.documentNumber = 'Document number is required';
    }
    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);
    return valid;
  };

  // Validate immediately on mount
  useEffect(() => {
    const valid = !!(draft?.document?.documentNumber?.trim());
    setIsValid(valid);
  }, []);

  // Validate whenever data or showErrors changes
  useEffect(() => {
    if (showErrors) {
      validate();
    } else {
      const valid = !!(draft?.document?.documentNumber?.trim());
      setIsValid(valid);
    }
  }, [draft?.document, showErrors]);

  const handleNext = () => {
    if (isValid) {
      onNext(false);
    } else {
      validate();
      onNext(true); // Tell parent to show errors
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>
          Document Information
        </Text>

        <View style={styles.selectContainer}>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.xs }]}>
            Document Type
          </Text>
          <View style={styles.selectRow}>
            {(['PASSPORT', 'DRIVER_LICENSE', 'NATIONAL_ID'] as const).map((type) => (
              <Button
                key={type}
                title={type.replace('_', ' ')}
                onPress={() => {
                  updateDraft({ 
                    document: { 
                      documentType: type,
                      documentNumber: draft?.document?.documentNumber || ''
                    } 
                  });
                }}
                variant={draft?.document.documentType === type ? 'primary' : 'outline'}
                style={styles.selectButton}
              />
            ))}
          </View>
        </View>

        <Input
          label="Document Number"
          value={draft?.document?.documentNumber || ''}
          onChangeText={(text) => {
            updateDraft({ 
              document: { 
                documentType: draft?.document?.documentType || 'PASSPORT',
                documentNumber: text
              } 
            });
            if (errors.documentNumber) {
              setErrors({ ...errors, documentNumber: '' });
              validate();
            }
          }}
          onBlur={() => {
            setTouched({ ...touched, documentNumber: true });
            if (showErrors) validate();
          }}
          placeholder="P12345678"
          error={showErrors && touched.documentNumber ? errors.documentNumber : undefined}
        />
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
  selectContainer: {
    marginBottom: 16,
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectButton: {
    flex: 1,
    minWidth: 100,
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
