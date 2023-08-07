import { Logger } from '@nestjs/common'
import { TypeormLogger } from '../typeorm-logger'

jest.mock('@nestjs/common', () => ({
    Logger: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        verbose: jest.fn()
    }
}))

describe('TypeormLogger', () => {
    let typeormLogger: TypeormLogger

    beforeEach(() => {
        typeormLogger = new TypeormLogger()
    })

    it('logQuery', () => {
        const query = 'SELECT * FROM users'
        const parameters = ['param1', 'param2']

        typeormLogger.logQuery(query, parameters)

        expect(Logger.verbose).toHaveBeenCalledWith('QUERY', 'ORM', { query, parameters })
    })

    it('logQueryError', () => {
        const message = 'Query Error'
        const query = 'SELECT * FROM users'
        const parameters = ['param1', 'param2']
        const error = new Error(message)

        typeormLogger.logQueryError(error, query, parameters)
        expect(Logger.error).toHaveBeenCalledWith(error.message, 'ORM', { query, parameters })

        typeormLogger.logQueryError(message, query, parameters)
        expect(Logger.error).toHaveBeenCalledWith(message, 'ORM', { query, parameters })
    })

    it('logQuerySlow', () => {
        const runningTime = 2000 // ms
        const query = 'SELECT * FROM users'
        const parameters = ['param1', 'param2']

        typeormLogger.logQuerySlow(runningTime, query, parameters)

        expect(Logger.warn).toHaveBeenCalledWith('Slow Query', 'ORM', {
            query,
            parameters,
            runningTime
        })
    })

    it('logSchemaBuild', () => {
        const message = 'Schema build log message'

        typeormLogger.logSchemaBuild(message)

        expect(Logger.log).toHaveBeenCalledWith(message, 'ORM')
    })

    it('logMigration', () => {
        const message = 'Migration log message'

        typeormLogger.logMigration(message)

        expect(Logger.log).toHaveBeenCalledWith(message, 'ORM')
    })

    it('log', () => {
        const message = 'Log message'

        typeormLogger.log('warn', message)

        expect(Logger.warn).toHaveBeenCalledWith(message, 'ORM')
    })
})
