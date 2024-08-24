import type { Config } from 'jest'
import baseOption from '../../../jest.config'

const config: Config = {
    ...baseOption,
    rootDir: '../../../',
    roots: ['<rootDir>/projects/apps/services/src'],
    collectCoverageFrom: [
        'projects/apps/services/src/**/*.ts',
        '!**/main.ts',
        '!**/index.ts',
        '!**/*.module.ts'
    ]
}

export default config
