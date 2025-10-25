import { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  moduleNameMapper: {
    '@config/(.*)': '<rootDir>/src/config/$1',
    '@shared/(.*)': '<rootDir>/src/shared/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@http/(.*)': '<rootDir>/src/http/$1',
    '@infra/(.*)': '<rootDir>/src/infra/$1'
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

export default config;
