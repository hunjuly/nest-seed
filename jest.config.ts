import type { Config } from 'jest'

const projects = '<rootDir>/projects'
const config: Config = {
    maxWorkers: 1, // --runInBand, jest 테스트가 동시에 실행되면 서로 postgresql을 초기화 해서 오류가 발생한다.
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '.*\\.spec\\.ts$',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    testTimeout: 10000, // 10s, 테스트에서 DB 상태에 따라서 가끔 5초를 초과하는 경우가 있다.
    collectCoverage: false,
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    coverageReporters: ['json-summary', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['__tests__'],
    coverageDirectory: '<rootDir>/_output/coverage',
    rootDir: '.',
    roots: [projects],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^services/(.*)$': `${projects}/apps/services/src/$1`,
        '^common$': `${projects}/libs/common/src/index`,
        '^common/test$': `${projects}/libs/common/src/test/index`,
        '^core$': `${projects}/libs/core/src/index`,
        '^config$': `${projects}/libs/config/index`
    },
    collectCoverageFrom: [
        `${projects}/apps/*/src/**/*.ts`,
        `${projects}/libs/*/src/**/*.ts`,
        `!${projects}/apps/*/src/main.ts`,
        `!${projects}/libs/common/src/test/**/*`,
        '!**/{index,*.module}.ts'
    ]
}
export default config
