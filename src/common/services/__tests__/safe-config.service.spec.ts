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

    it('값이 있을 때, 올바른 문자열 환경 변수를 반환해야 한다', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => 'test_value')

        const value = service.getString('TEST_KEY')
        expect(value).toBe('test_value')
    })

    it('값이 없을 때, ConfigException을 발생시켜야 한다 (문자열)', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => undefined)

        expect(() => service.getString('TEST_KEY')).toThrow(ConfigException)
    })

    it('값이 있을 때, 올바른 숫자 환경 변수를 반환해야 한다', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => '123')

        const value = service.getNumber('TEST_KEY')
        expect(value).toBe(123)
    })

    it('값이 없을 때, ConfigException을 발생시켜야 한다 (숫자)', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => undefined)

        expect(() => service.getNumber('TEST_KEY')).toThrow(ConfigException)
    })

    it('값이 숫자가 아닐 때, ConfigException을 발생시켜야 한다', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => 'not_a_number')

        expect(() => service.getNumber('TEST_KEY')).toThrow(ConfigException)
    })

    it('값이 "true"일 때, 올바른 bool값을 반환해야 한다', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => 'true')

        const value = service.getBoolean('TEST_KEY')
        expect(value).toBe(true)
    })

    it('값이 "false"일 때, 올바른 bool값을 반환해야 한다', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => 'false')

        const value = service.getBoolean('TEST_KEY')
        expect(value).toBe(false)
    })

    it('값이 없을 때, ConfigException을 발생시켜야 한다 (bool)', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => undefined)

        expect(() => service.getBoolean('TEST_KEY')).toThrow(ConfigException)
    })

    it('값이 true/false가 아닐 때, ConfigException을 발생시켜야 한다', () => {
        jest.spyOn(configService, 'get').mockImplementation(() => 'not_a_bool')

        expect(() => service.getBoolean('TEST_KEY')).toThrow(ConfigException)
    })
})
