import type { Config } from 'jest'

const config: Config = {
    maxWorkers: 1, // --runInBand, jest 테스트가 동시에 실행되면 서로 postgresql을 초기화 해서 오류가 발생한다.
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    roots: ['<rootDir>/src/app', '<rootDir>/src/common'],
    testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
    moduleNameMapper: {
        '^app/(.*)$': '<rootDir>/src/app/$1',
        '^common$': '<rootDir>/src/common/index',
        '^common/test$': '<rootDir>/src/common/test/index',
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
        'src/app/**/*.ts',
        '!src/app/main.ts',
        'src/common/**/*.ts',
        '!src/common/test/**/*',
        '!src/**/index.ts',
        '!src/**/*.module.ts'
    ],
    coverageReporters: ['json-summary', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: './coverage',
    // 60s, 테스트에서 DB 상태에 따라서 가끔 5초를 초과하는 경우가 있다.
    // memory-mongodb 다운로드가 느린 경우가 있다.
    testTimeout: 60000
}

export default config
