import { ConfigService } from '@nestjs/config'
import { TestingModule } from '@nestjs/testing'
import { ConfigException } from 'src/common'
import { createTestModule } from 'src/common/test'
import { SafeConfigService } from '../safe-config.service'

describe('SafeConfigService', () => {
    let module: TestingModule
    let service: SafeConfigService
    let configService: ConfigService

    beforeEach(async () => {
        module = await createTestModule({
            providers: [
                SafeConfigService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn()
                    }
                }
            ]
        })

        service = module.get(SafeConfigService)
        configService = module.get(ConfigService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('정의되어 있어야 한다', () => {
        expect(service).toBeDefined()
    })

    describe('getString', () => {
        it('문자열 환경 변수를 반환한다', () => {
            jest.spyOn(configService, 'get').mockImplementation(() => 'test_value')

            const value = service.getString('TEST_KEY')
            expect(value).toBe('test_value')
        })

        it('값이 없으면 ConfigException', () => {
            jest.spyOn(configService, 'get').mockImplementation(() => undefined)

            expect(() => service.getString('TEST_KEY')).toThrow(ConfigException)
        })
    })

    describe('getNumber', () => {
        it('숫자 환경 변수를 반환한다', () => {
            jest.spyOn(configService, 'get').mockImplementation(() => '123')

            const value = service.getNumber('TEST_KEY')
            expect(value).toBe(123)
        })

        it('값이 없으면 ConfigException', () => {
            jest.spyOn(configService, 'get').mockImplementation(() => undefined)

            expect(() => service.getNumber('TEST_KEY')).toThrow(ConfigException)
        })

        it('값이 숫자가 아니면 ConfigException', () => {
            jest.spyOn(configService, 'get').mockImplementation(() => 'not_a_number')

            expect(() => service.getNumber('TEST_KEY')).toThrow(ConfigException)
        })
    })

    describe('getBoolean', () => {
        it("값이 'true'면 true를 반환한다", () => {
            jest.spyOn(configService, 'get').mockImplementation(() => 'true')

            const value = service.getBoolean('TEST_KEY')
            expect(value).toBe(true)
        })

        it("값이 'false'면 false를 반환한다", () => {
            jest.spyOn(configService, 'get').mockImplementation(() => 'false')

            const value = service.getBoolean('TEST_KEY')
            expect(value).toBe(false)
        })

        it('값이 없으면 ConfigException', () => {
            jest.spyOn(configService, 'get').mockImplementation(() => undefined)

            expect(() => service.getBoolean('TEST_KEY')).toThrow(ConfigException)
        })

        it("값이 'true'나 'false'가 아니면 ConfigException", () => {
            jest.spyOn(configService, 'get').mockImplementation(() => 'not_a_bool')

            expect(() => service.getBoolean('TEST_KEY')).toThrow(ConfigException)
        })
    })
})
