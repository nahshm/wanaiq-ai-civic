import { useMemo } from 'react';

// Feature toggle configuration
// In a production app, this could be fetched from an API or environment variables
const FEATURE_TOGGLES = {
  baraza: (typeof process !== 'undefined' && (process.env.REACT_APP_BARAZA_ENABLED === 'true' || process.env.VITE_BARAZA_ENABLED === 'true')) || false,
  // Add other features here as needed
} as const;

export type FeatureName = keyof typeof FEATURE_TOGGLES;

/**
 * Hook to check if a feature is enabled
 * @param featureName - The name of the feature to check
 * @returns boolean indicating if the feature is enabled
 */
export const useFeatureToggle = (featureName: FeatureName): boolean => {
  return useMemo(() => {
    return FEATURE_TOGGLES[featureName] ?? false;
  }, [featureName]);
};

/**
 * Hook to get all feature toggles
 * @returns object with all feature toggles
 */
export const useFeatureToggles = () => {
  return useMemo(() => FEATURE_TOGGLES, []);
};

/**
 * Utility function to check if a feature is enabled (for use outside React components)
 * @param featureName - The name of the feature to check
 * @returns boolean indicating if the feature is enabled
 */
export const isFeatureEnabled = (featureName: FeatureName): boolean => {
  return FEATURE_TOGGLES[featureName] ?? false;
};
