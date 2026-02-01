// Jest setup file
// Note: We're not importing @testing-library/jest-native/extend-expect here
// because it may cause issues with the test environment setup

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native Platform - create a simple mock without requiring actual module
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    // Add other commonly used React Native exports as needed
    StyleSheet: {
      create: jest.fn((styles) => styles),
    },
    View: 'View',
    Text: 'Text',
    ScrollView: 'ScrollView',
    TouchableOpacity: 'TouchableOpacity',
  };
});

// Mock __DEV__ global
global.__DEV__ = true;
