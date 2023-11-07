import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
    moduleNameMapper: {
        '^common': '<rootDir>/src/common',
        '^config': '<rootDir>/src/config',
        '^seed/(.*)$': '<rootDir>/src/seed/$1',
        '^app/(.*)$': '<rootDir>/src/app/$1'
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
        'src/**/*.{ts,tsx}',
        '!src/**/index.{ts,tsx}',
        '!src/**/*.module.ts',
        '!src/app/main.ts',
        '!src/app/databases/**/*',
        '!src/common/test/**/*',
        '!src/config/**/*',
    ],
    coverageReporters: ['json-summary', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: './coverage',
    testTimeout: 60000 // 60s, 테스트에서 DB 상태에 따라서 가끔 5초를 초과하는 경우가 있다.
}

export default config
