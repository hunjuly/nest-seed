import type { Config } from 'jest'
import baseOption from './jest.config'

const config: Config = {
    ...baseOption,
    roots: ['<rootDir>/src/common'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/common/**/*.ts',
        '!src/common/test/**/*',
        '!src/**/index.ts',
        '!src/**/*.module.ts'
    ]
}

export default config
