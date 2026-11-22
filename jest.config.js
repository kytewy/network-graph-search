const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // Keep Jest's module scan out of the Python virtualenv and build output
  // (avoids "Haste module naming collision" warnings from venv packages)
  modulePathIgnorePatterns: ['<rootDir>/venv/', '<rootDir>/.venv/', '<rootDir>/.next/'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/venv/',
    '/backend/',
    '/scripts/',
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// nuqs ships only ES modules, so Jest must compile it (P1-12's Vitest won't need this)
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  config.transformIgnorePatterns = [
    '/node_modules/(?!(nuqs)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ]
  return config
}
