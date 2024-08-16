import type { Config } from 'jest'
import baseOption from './jest.config'

const config: Config = {
    ...baseOption,
    roots: ['<rootDir>/projects/libs/common'],
    collectCoverage: true,
    collectCoverageFrom: [
        'projects/libs/common/**/*.ts',
        '!projects/libs/common/test/**/*',
        '!projects/libs/**/index.ts',
        '!projects/libs/**/*.module.ts'
    ]
}

export default config
