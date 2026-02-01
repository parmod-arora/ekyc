// Onboarding Screen - Multi-step flow

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { useTheme } from '../../src/theme';
import {
  ProfileStep,
  DocumentStep,
  AddressStep,
  ConsentsStep,
  ReviewStep,
} from './onboarding/components';

export default function OnboardingScreen() {
  const { colors, spacing, typography } = useTheme();
  const {
    draft,
    currentStep,
    initializeDraft,
    nextStep,
    previousStep,
  } = useOnboardingStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initKey, setInitKey] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeDraft();
      // Mark that onboarding has been started
      const { markOnboardingStarted } = useOnboardingStore.getState();
      markOnboardingStarted();
      setIsInitializing(false);
      // Increment key to force step components to remount and validate
      setInitKey(prev => prev + 1);
    };
    init();
  }, []);

  useEffect(() => {
    // Reset errors when step changes
    setShowErrors(false);
  }, [currentStep]);

  const handleNext = (shouldShowErrors?: boolean) => {
    if (currentStep < 5) {
      if (shouldShowErrors) {
        setShowErrors(true);
      } else {
        nextStep();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      previousStep();
    }
  };

  const renderStep = () => {
    // Use key to force remount when step changes or after initialization
    const stepKey = `step-${currentStep}-${initKey}`;
    
    switch (currentStep) {
      case 1:
        return (
          <ProfileStep
            key={stepKey}
            onNext={handleNext}
            onPrevious={undefined}
            showErrors={showErrors}
          />
        );
      case 2:
        return (
          <DocumentStep
            key={stepKey}
            onNext={handleNext}
            onPrevious={handlePrevious}
            showErrors={showErrors}
          />
        );
      case 3:
        return (
          <AddressStep
            key={stepKey}
            onNext={handleNext}
            onPrevious={handlePrevious}
            showErrors={showErrors}
          />
        );
      case 4:
        return (
          <ConsentsStep
            key={stepKey}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <ReviewStep
            key={stepKey}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  if (isInitializing || !draft) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text }]}>
          Step {currentStep} of 5
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / 5) * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
      </View>

      {renderStep()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
