import type { Config } from 'jest'
import baseOption from '../../../jest.config'

const project = '<rootDir>/projects/apps/gateway'
const config: Config = {
    ...baseOption,
    rootDir: '../../../',
    roots: [project],
    collectCoverageFrom: [
        `${project}/src/**/*.ts`,
        `!${project}/src/main.ts`,
        `!${project}/src/**/{index,*.module}.ts`
    ]
}
export default config
