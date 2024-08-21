import type { Config } from 'jest'

const config: Config = {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    roots: [
        '<rootDir>/projects/app',
        '<rootDir>/projects/apps/services/src',
        '<rootDir>/projects/libs/common'
    ],
    testRegex: '.*\\.spec\\.ts$',
    moduleNameMapper: {
        '^app/(.*)$': '<rootDir>/projects/app/$1',
        '^common$': '<rootDir>/projects/libs/common/src/index',
        '^config$': '<rootDir>/projects/libs/config/index',
        '^core$': '<rootDir>/projects/libs/core/index'
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    // collectCoverage: false,
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    collectCoverageFrom: [
        'projects/app/**/*.ts',
        // 'projects/apps/**/*.ts',
        'projects/libs/**/*.ts',
        '!projects/libs/config/**/*.ts',
        '!projects/**/jest.config.ts',
        '!projects/**/main.ts',
        '!projects/**/index.ts',
        '!projects/**/*.module.ts'
    ],
    coverageReporters: ['json-summary', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: '<rootDir>/_output/coverage',
    testTimeout: 15000 // 15s, 테스트에서 DB 상태에 따라서 가끔 5초를 초과하는 경우가 있다.
}

export default config
