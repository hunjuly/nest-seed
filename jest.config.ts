import type { Config } from 'jest'

const config: Config = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    roots: ['<rootDir>/projects/apps', '<rootDir>/projects/libs'],
    testRegex: '.*\\.spec\\.ts$',
    moduleNameMapper: {
        '^services/(.*)$': '<rootDir>/projects/apps/services/src/$1',
        '^common$': '<rootDir>/projects/libs/common/src/index',
        '^config$': '<rootDir>/projects/config/index'
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    collectCoverageFrom: [
        'projects/apps/**/*.ts',
        'projects/libs/**/*.ts',
        '!**/jest.config.ts',
        '!**/main.ts',
        '!**/index.ts',
        '!**/*.module.ts'
    ],
    coverageReporters: ['lcov', 'text'],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: '<rootDir>/_output/coverage',
    testTimeout: 15000
}

export default config
