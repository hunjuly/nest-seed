import type { Config } from 'jest'
import baseOption from '../../../jest.config'

// const project = '<rootDir>/projects/apps/gateway'

const config: Config = {
    ...baseOption,
    rootDir:'../../../',
    roots: ['<rootDir>/projects/apps/services/src'],
    collectCoverageFrom: [
        'projects/apps/services/**/*.ts',
        '!projects/**/main.ts',
        '!projects/**/index.ts',
        '!projects/**/*.module.ts'
    ]
}

export default config
