import type { Config } from 'jest'
import baseOption from './jest.config'

const config: Config = {
    ...baseOption,
    roots: ['<rootDir>/src/app'],
    collectCoverage: true,
    collectCoverageFrom: ['src/app/**/*.ts', '!src/app/main.ts', '!src/**/index.ts', '!src/**/*.module.ts']
}

export default config
