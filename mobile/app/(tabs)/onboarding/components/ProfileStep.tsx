// Profile Step Component

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '../../../../src/store/onboardingStore';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/Button';
import { Input } from '../../../../src/components/Input';

interface ProfileStepProps {
  onNext: (showErrors?: boolean) => void;
  onPrevious?: () => void;
  showErrors?: boolean;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
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
    if (!draft?.profile?.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!draft?.profile?.dateOfBirth?.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(draft.profile.dateOfBirth)) {
        newErrors.dateOfBirth = 'Date must be in YYYY-MM-DD format';
      } else {
        const date = new Date(draft.profile.dateOfBirth);
        const isValidDate = !isNaN(date.getTime());
        const [year, month, day] = draft.profile.dateOfBirth.split('-').map(Number);
        const dateMatches = date.getFullYear() === year && 
                           date.getMonth() + 1 === month && 
                           date.getDate() === day;
        if (!isValidDate || !dateMatches) {
          newErrors.dateOfBirth = 'Please enter a valid date';
        }
      }
    }
    if (!draft?.profile?.nationality?.trim()) {
      newErrors.nationality = 'Nationality is required';
    } else {
      const countryCodeRegex = /^[A-Z]{2}$/;
      if (!countryCodeRegex.test(draft.profile.nationality.trim().toUpperCase())) {
        newErrors.nationality = 'Nationality must be a 2-letter country code (e.g., US, GB)';
      }
    }
    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);
    return valid;
  };

  // Validate immediately on mount
  useEffect(() => {
    const dateOfBirth = draft?.profile?.dateOfBirth?.trim() || '';
    const nationality = draft?.profile?.nationality?.trim() || '';
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const countryCodeRegex = /^[A-Z]{2}$/;
    
    let isDateValid = false;
    if (dateOfBirth && dateRegex.test(dateOfBirth)) {
      const date = new Date(dateOfBirth);
      const isValidDate = !isNaN(date.getTime());
      if (isValidDate) {
        const [year, month, day] = dateOfBirth.split('-').map(Number);
        isDateValid = date.getFullYear() === year && 
                     date.getMonth() + 1 === month && 
                     date.getDate() === day;
      }
    }
    const isNationalityValid = nationality && countryCodeRegex.test(nationality.toUpperCase());
    
    const valid = !!(draft?.profile?.fullName?.trim() && 
                    isDateValid && 
                    isNationalityValid);
    setIsValid(valid);
  }, []);

  // Validate whenever data or showErrors changes
  useEffect(() => {
    if (showErrors) {
      validate();
    } else {
      const dateOfBirth = draft?.profile?.dateOfBirth?.trim() || '';
      const nationality = draft?.profile?.nationality?.trim() || '';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const countryCodeRegex = /^[A-Z]{2}$/;
      
      let isDateValid = false;
      if (dateOfBirth && dateRegex.test(dateOfBirth)) {
        const date = new Date(dateOfBirth);
        const isValidDate = !isNaN(date.getTime());
        if (isValidDate) {
          const [year, month, day] = dateOfBirth.split('-').map(Number);
          isDateValid = date.getFullYear() === year && 
                       date.getMonth() + 1 === month && 
                       date.getDate() === day;
        }
      }
      const isNationalityValid = nationality && countryCodeRegex.test(nationality.toUpperCase());
      
      const valid = !!(draft?.profile?.fullName?.trim() && 
                      isDateValid && 
                      isNationalityValid);
      setIsValid(valid);
    }
  }, [draft?.profile, showErrors]);

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
          Profile Information
        </Text>

        <Input
          label="Full Name"
          value={draft?.profile?.fullName || ''}
          onChangeText={(text) => {
            updateDraft({ 
              profile: { 
                fullName: text,
                dateOfBirth: draft?.profile?.dateOfBirth || '',
                nationality: draft?.profile?.nationality || ''
              } 
            });
            if (errors.fullName) {
              setErrors({ ...errors, fullName: '' });
              validate();
            }
          }}
          onBlur={() => {
            setTouched({ ...touched, fullName: true });
            if (showErrors) validate();
          }}
          placeholder="Jane Doe"
          error={showErrors && touched.fullName ? errors.fullName : undefined}
        />

        <Input
          label="Date of Birth"
          value={draft?.profile?.dateOfBirth || ''}
          onChangeText={(text) => {
            updateDraft({ 
              profile: { 
                fullName: draft?.profile?.fullName || '',
                dateOfBirth: text,
                nationality: draft?.profile?.nationality || ''
              } 
            });
            if (errors.dateOfBirth) {
              setErrors({ ...errors, dateOfBirth: '' });
              validate();
            }
          }}
          onBlur={() => {
            setTouched({ ...touched, dateOfBirth: true });
            if (showErrors) validate();
          }}
          placeholder="YYYY-MM-DD"
          error={showErrors && touched.dateOfBirth ? errors.dateOfBirth : undefined}
        />

        <Input
          label="Nationality"
          value={draft?.profile?.nationality || ''}
          onChangeText={(text) => {
            const upperText = text.toUpperCase();
            updateDraft({ 
              profile: { 
                fullName: draft?.profile?.fullName || '',
                dateOfBirth: draft?.profile?.dateOfBirth || '',
                nationality: upperText
              } 
            });
            if (errors.nationality) {
              setErrors({ ...errors, nationality: '' });
              validate();
            }
          }}
          onBlur={() => {
            setTouched({ ...touched, nationality: true });
            if (showErrors) validate();
          }}
          placeholder="US"
          error={showErrors && touched.nationality ? errors.nationality : undefined}
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
