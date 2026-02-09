// Mock the winter runtime requirement
jest.mock('expo/src/winter/runtime.native.ts', () => ({}), { virtual: true });
jest.mock('expo/src/winter/installGlobal.ts', () => ({
  __ExpoImportMetaRegistry: {},
}), { virtual: true });

// Mock expo modules before they're imported
jest.mock('expo', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {},
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-router
jest.mock('expo-router', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({}),
    useGlobalSearchParams: () => ({}),
    useSegments: () => [],
    Link: 'Link',
    Stack: {
      Screen: 'Screen',
    },
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
