import { MethodLog } from '../method-log'

export const mockLogger = {
    log: jest.fn().mockImplementation(),
    error: jest.fn().mockImplementation(),
    warn: jest.fn().mockImplementation(),
    debug: jest.fn().mockImplementation(),
    verbose: jest.fn().mockImplementation()
}

jest.mock('@nestjs/common', () => {
    return {
        ...jest.requireActual('@nestjs/common'),
        Logger: jest.fn().mockImplementation(() => mockLogger)
    }
})

// jest.mock의 초기화 문제 때문에 TestRepository를 fixture.ts로 분리하지 못했다.
export class TestService {
    @MethodLog()
    async printLog(_data: string) {
        return 'return value'
    }

    @MethodLog('debug')
    async debugLog() {}

    @MethodLog()
    async throwError(_data: string) {
        throw new Error('error message')
    }

    @MethodLog()
    syncMethod() {}
}

describe('@MethodLog()', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const service = new TestService()

    it('printLog', async () => {
        await service.printLog('Test User')

        expect(mockLogger.log).toHaveBeenCalledWith('TestService.printLog completed', {
            args: '["Test User"]',
            duration: expect.any(Number),
            return: '"return value"'
        })
    })

    it('debugLog', async () => {
        await service.debugLog()

        expect(mockLogger.debug).toHaveBeenCalledWith('TestService.debugLog completed', {
            args: '[]',
            duration: expect.any(Number),
            return: undefined
        })
    })

    it('throwError', async () => {
        await expect(service.throwError('data')).rejects.toThrow()
        expect(mockLogger.error).toHaveBeenCalledWith('TestService.throwError failed', {
            args: '["data"]',
            duration: expect.any(Number),
            error: 'error message'
        })
    })

    it('syncMethod', async () => {
        await service.syncMethod()

        expect(mockLogger.log).toHaveBeenCalledWith('TestService.syncMethod completed', {
            args: '[]',
            duration: expect.any(Number),
            return: undefined
        })
    })
})
