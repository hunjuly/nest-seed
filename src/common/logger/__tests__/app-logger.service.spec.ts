import * as winston from 'winston'
import { AppLoggerService } from '../app-logger.service'

describe('AppLoggerService', () => {
    let appLoggerService: AppLoggerService
    let winstonLogger: winston.Logger

    beforeEach(() => {
        winstonLogger = winston.createLogger({
            silent: true,
            level: '',
            format: winston.format.simple(),
            transports: [new winston.transports.Console()]
        })
        appLoggerService = new AppLoggerService(winstonLogger)
    })

    afterEach(() => {
        winstonLogger.close()
    })

    it('정보 메시지를 로깅해야 합니다.', () => {
        const spy = jest.spyOn(winstonLogger, 'info')
        appLoggerService.log('테스트 정보 메시지')
        expect(spy).toHaveBeenCalledWith('테스트 정보 메시지', [])
    })

    it('오류 메시지를 로깅해야 합니다.', () => {
        const spy = jest.spyOn(winstonLogger, 'error')
        appLoggerService.error('테스트 오류 메시지')
        expect(spy).toHaveBeenCalledWith('테스트 오류 메시지', [])
    })

    it('경고 메시지를 로깅해야 합니다.', () => {
        const spy = jest.spyOn(winstonLogger, 'warn')
        appLoggerService.warn('테스트 경고 메시지')
        expect(spy).toHaveBeenCalledWith('테스트 경고 메시지', [])
    })

    it('디버그 메시지를 로깅해야 합니다.', () => {
        const spy = jest.spyOn(winstonLogger, 'debug')
        appLoggerService.debug('테스트 디버그 메시지')
        expect(spy).toHaveBeenCalledWith('테스트 디버그 메시지', [])
    })

    it('상세 메시지를 로깅해야 합니다.', () => {
        const spy = jest.spyOn(winstonLogger, 'verbose')
        appLoggerService.verbose('테스트 상세 메시지')
        expect(spy).toHaveBeenCalledWith('테스트 상세 메시지', [])
    })
})
