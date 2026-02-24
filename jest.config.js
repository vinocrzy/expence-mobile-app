/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.ts'],
  clearMocks: true,
  forceExit: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native(-community)?|expo(-.*)?|@expo(-.*)?/.*|@unimodules/.*|unimodules|@react-navigation/.*|lucide-react-native|uuid))',
  ],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/hooks/**/*.ts',
    'src/components/**/*.tsx',
    '!src/**/*.d.ts',
  ],
  testTimeout: 30000,
};
