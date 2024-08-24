import type { Config } from 'jest'
import baseOption from '../../../jest.config'

const config: Config = {
    ...baseOption,
    rootDir: '../../../',
    roots: ['<rootDir>/projects/libs/common/src'],
    collectCoverageFrom: [
        'projects/libs/common/src/**/*.ts',
        '!**/main.ts',
        '!**/index.ts',
        '!**/*.module.ts'
    ]
}

export default config
