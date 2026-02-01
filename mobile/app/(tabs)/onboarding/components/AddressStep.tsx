// Address Step Component

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '../../../../src/store/onboardingStore';
import { useTheme } from '../../../../src/theme';
import { Button } from '../../../../src/components/Button';
import { Input } from '../../../../src/components/Input';

interface AddressStepProps {
  onNext: (showErrors?: boolean) => void;
  onPrevious?: () => void;
  showErrors?: boolean;
}

export const AddressStep: React.FC<AddressStepProps> = ({
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
    if (!draft?.address?.addressLine1?.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }
    if (!draft?.address?.city?.trim()) {
      newErrors.city = 'City is required';
    }
    if (!draft?.address?.country?.trim()) {
      newErrors.country = 'Country is required';
    } else {
      const countryCodeRegex = /^[A-Z]{2}$/;
      if (!countryCodeRegex.test(draft.address.country.trim().toUpperCase())) {
        newErrors.country = 'Country must be a 2-letter country code (e.g., US, GB)';
      }
    }
    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    setIsValid(valid);
    return valid;
  };

  // Validate immediately on mount
  useEffect(() => {
    const country = draft?.address?.country?.trim() || '';
    const countryCodeRegex = /^[A-Z]{2}$/;
    const isCountryValid = country && countryCodeRegex.test(country.toUpperCase());
    
    const valid = !!(draft?.address?.addressLine1?.trim() && 
                    draft?.address?.city?.trim() && 
                    isCountryValid);
    setIsValid(valid);
  }, []);

  // Validate whenever data or showErrors changes
  useEffect(() => {
    if (showErrors) {
      validate();
    } else {
      const country = draft?.address?.country?.trim() || '';
      const countryCodeRegex = /^[A-Z]{2}$/;
      const isCountryValid = country && countryCodeRegex.test(country.toUpperCase());
      
      const valid = !!(draft?.address?.addressLine1?.trim() && 
                      draft?.address?.city?.trim() && 
                      isCountryValid);
      setIsValid(valid);
    }
  }, [draft?.address, showErrors]);

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
          Address Information
        </Text>

        <Input
          label="Address Line 1"
          value={draft?.address?.addressLine1 || ''}
          onChangeText={(text) => {
            updateDraft({ 
              address: { 
                addressLine1: text,
                city: draft?.address?.city || '',
                country: draft?.address?.country || ''
              } 
            });
            if (errors.addressLine1) {
              setErrors({ ...errors, addressLine1: '' });
              validate();
            }
          }}
          onBlur={() => {
            setTouched({ ...touched, addressLine1: true });
            if (showErrors) validate();
          }}
          placeholder="123 Main St"
          error={showErrors && touched.addressLine1 ? errors.addressLine1 : undefined}
        />

        <Input
          label="City"
          value={draft?.address?.city || ''}
          onChangeText={(text) => {
            updateDraft({ 
              address: { 
                addressLine1: draft?.address?.addressLine1 || '',
                city: text,
                country: draft?.address?.country || ''
              } 
            });
            if (errors.city) {
              setErrors({ ...errors, city: '' });
              validate();
            }
          }}
          onBlur={() => {
            setTouched({ ...touched, city: true });
            if (showErrors) validate();
          }}
          placeholder="Springfield"
          error={showErrors && touched.city ? errors.city : undefined}
        />

        <Input
          label="Country"
          value={draft?.address?.country || ''}
          onChangeText={(text) => {
            const upperText = text.toUpperCase();
            updateDraft({ 
              address: { 
                addressLine1: draft?.address?.addressLine1 || '',
                city: draft?.address?.city || '',
                country: upperText
              } 
            });
            if (errors.country) {
              setErrors({ ...errors, country: '' });
              validate();
            }
          }}
          onBlur={() => {
            setTouched({ ...touched, country: true });
            if (showErrors) validate();
          }}
          placeholder="US"
          error={showErrors && touched.country ? errors.country : undefined}
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
