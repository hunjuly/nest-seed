import { Logger } from '@nestjs/common'

jest.mock('@nestjs/common', () => {
    // 실제 Logger 클래스를 모의하는 가짜 클래스를 정의합니다.
    const originalModule = jest.requireActual('@nestjs/common')
    class Logger {
        static log = jest.fn()
        static error = jest.fn()
        static warn = jest.fn()
        static verbose = jest.fn().mockReturnValue('return value')
    }
    /**
     * 모듈의 나머지 부분을 유지하고 Logger만 대체한다.
     * 그렇지 않으면 '@nestjs/common'을 사용하는 다른 소스파일에서 '@nestjs/common'을 사용하지 못하게 된다.
     */
    return { ...originalModule, Logger }
})

it('mocking a module', () => {
    const value = Logger.verbose('arg1', 'arg2')

    expect(Logger.verbose).toHaveBeenCalledWith('arg1', 'arg2')
    expect(value).toEqual('return value')
})
