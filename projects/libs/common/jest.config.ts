import type { Config } from 'jest'
import baseOption from '../../../jest.config'

const project = '<rootDir>/projects/libs/common'
const config: Config = {
    ...baseOption,
    rootDir: '../../../',
    roots: [project],
    collectCoverageFrom: [
        `${project}/src/**/*.ts`,
        `!${project}/src/test/**/*`,
        `!${project}/src/**/{index,*.module}.ts`
    ]
}
export default config
