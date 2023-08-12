import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1'
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    collectCoverage: false,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/index.{ts,tsx}',
        '!src/main.ts',
        '!src/common/test/**/*',
        '!src/database/**/*',
        '!src/**/*.module.ts'
    ],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: './coverage',
    testTimeout: 60000 // 60s, 테스트에서 DB 상태에 따라서 가끔 5초를 초과하는 경우가 있다.
}

export default config
