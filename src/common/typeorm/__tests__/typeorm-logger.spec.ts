import { Logger } from '@nestjs/common'
import { TypeormLogger } from '../typeorm-logger'

// jest 모의 함수 생성
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

    it('쿼리를 올바르게 로깅해야 합니다', () => {
        const query = 'SELECT * FROM users'
        const parameters = ['param1', 'param2']

        typeormLogger.logQuery(query, parameters)

        expect(Logger.verbose).toHaveBeenCalledWith('QUERY', 'ORM', { query, parameters })
    })

    it('쿼리 오류를 올바르게 로깅해야 합니다', () => {
        const message = 'Query Error'
        const error = new Error(message)
        const query = 'SELECT * FROM users'
        const parameters = ['param1', 'param2']

        typeormLogger.logQueryError(error, query, parameters)
        expect(Logger.error).toHaveBeenCalledWith(error.message, 'ORM', { query, parameters })

        typeormLogger.logQueryError(message, query, parameters)
        expect(Logger.error).toHaveBeenCalledWith(message, 'ORM', { query, parameters })
    })

    it('느린 쿼리를 올바르게 로깅해야 합니다', () => {
        const runningTime = 2000 // ms
        const query = 'SELECT * FROM users'
        const parameters = ['param1', 'param2']

        typeormLogger.logQuerySlow(runningTime, query, parameters)

        expect(Logger.warn).toHaveBeenCalledWith('Detected slow database query', 'ORM', {
            query,
            parameters,
            runningTime
        })
    })

    it('스키마 빌드 로그를 올바르게 기록해야 합니다', () => {
        const message = 'Schema build log message'

        typeormLogger.logSchemaBuild(message)

        expect(Logger.log).toHaveBeenCalledWith(message, 'ORM')
    })

    it('마이그레이션 로그를 올바르게 기록해야 합니다', () => {
        const message = 'Migration log message'

        typeormLogger.logMigration(message)

        expect(Logger.log).toHaveBeenCalledWith(message, 'ORM')
    })

    it('로그 메시지를 올바르게 기록해야 합니다', () => {
        const level = 'warn'
        const message = 'Log message'

        typeormLogger.log(level, message)

        expect(Logger.warn).toHaveBeenCalledWith(message, 'ORM')

        typeormLogger.log('info', message)
        typeormLogger.log('log', message)

        expect(Logger.log).toHaveBeenCalledTimes(4) // 위의 logMigration, logSchemaBuild, 그리고 info와 log 레벨에서 호출되었음
    })
})
