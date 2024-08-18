import type { Config } from 'jest'
import baseOption from '../../../jest.config'

const config: Config = {
    ...baseOption,
    rootDir:'../../../',
    roots: ['<rootDir>/projects/libs/common/src'],
    collectCoverageFrom: [
        'projects/libs/common/**/*.ts',
        '!projects/libs/common/src/test/**/*',
        '!projects/libs/**/index.ts',
        '!projects/libs/**/*.module.ts'
    ]
}

export default config
