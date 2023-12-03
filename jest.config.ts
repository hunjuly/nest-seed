import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
    moduleNameMapper: {
        '^app/(.*)$': '<rootDir>/src/app/$1',
        '^common$': '<rootDir>/src/common/index',
        '^common/(.*)$': '<rootDir>/src/common/$1',
        '^config$': '<rootDir>/src/config/index',
        '^databases/(.*)$': '<rootDir>/src/databases/$1'
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    collectCoverage: false,
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    collectCoverageFrom: [
        'src/app/**/*.{ts,tsx}',
        '!src/app/main.ts',
        'src/common/**/*.{ts,tsx}',
        '!src/common/test/**/*',
        '!src/**/index.{ts,tsx}',
        '!src/**/*.module.ts'
    ],
    coverageReporters: ['json-summary', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: './coverage',
    testTimeout: 60000 // 60s, 테스트에서 DB 상태에 따라서 가끔 5초를 초과하는 경우가 있다.
}

export default config
