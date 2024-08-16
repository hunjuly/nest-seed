import type { Config } from 'jest'
import baseOption from './jest.config'

const config: Config = {
    ...baseOption,
    roots: ['<rootDir>/projects/app'],
    collectCoverage: true,
    collectCoverageFrom: [
        'projects/app/**/*.ts',
        '!projects/**/main.ts',
        '!projects/**/index.ts',
        '!projects/**/*.module.ts'
    ]
}

export default config
