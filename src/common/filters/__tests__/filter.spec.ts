import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { createHttpTestingModule } from 'common/test'
import { TestModule } from './filter.fixture'

describe('BaseRepository', () => {
    let module: TestingModule
    let request: any

    beforeEach(async () => {
        const sut = await createHttpTestingModule({
            imports: [TestModule]
        })

        module = sut.module
        request = sut.request

        // error를 console에 출력하지 않도록 설정
        sut.app.useLogger(false)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('ErrorFilter', async () => {
        const res = await request.get({
            url: '/error'
        })

        expect(res.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('HttpExceptionFilter', async () => {
        const res = await request.get({
            url: '/http-exception'
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })
})
