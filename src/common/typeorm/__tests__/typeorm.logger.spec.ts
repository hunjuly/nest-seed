import { Logger } from '@nestjs/common'
import { TypeormLogger } from '..'

jest.mock('@nestjs/common', () => {
    class Logger {
        static log = jest.fn()
        static error = jest.fn()
        static warn = jest.fn()
        static verbose = jest.fn()
    }

    const originalModule = jest.requireActual('@nestjs/common')

    return { ...originalModule, Logger }
})

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
        typeormLogger.log('warn', 'warn message')
        typeormLogger.log('info', 'info message')

        expect(Logger.warn).toHaveBeenCalledWith('warn message', 'ORM')
        expect(Logger.log).toHaveBeenCalledWith('info message', 'ORM')
    })
})
