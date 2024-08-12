import type { Config } from 'jest'

const config: Config = {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    roots: ['<rootDir>/src/app', '<rootDir>/src/common'],
    testRegex: '.*\\.spec\\.ts$',
    moduleNameMapper: {
        '^app/(.*)$': '<rootDir>/src/app/$1',
        '^common$': '<rootDir>/src/common/index',
        '^common/test$': '<rootDir>/src/common/test/index',
        '^config$': '<rootDir>/src/config/index'
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
        'src/app/**/*.ts',
        '!src/app/main.ts',
        'src/common/**/*.ts',
        '!src/common/test/**/*',
        '!src/**/index.ts',
        '!src/**/*.module.ts'
    ],
    coverageReporters: ['json-summary', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: '<rootDir>/_output/coverage',
    testTimeout: 15000 // 15s, 테스트에서 DB 상태에 따라서 가끔 5초를 초과하는 경우가 있다.
}

export default config
