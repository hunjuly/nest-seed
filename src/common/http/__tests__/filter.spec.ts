import { HttpStatus } from '@nestjs/common'
import { HttpTestEnv, createHttpTestEnv } from 'common/test'
import { TestModule } from './filter.fixture'

describe('common/filters', () => {
    let sut: HttpTestEnv
    let req: any

    beforeEach(async () => {
        sut = await createHttpTestEnv({
            imports: [TestModule]
        })

        req = sut.request
        // error를 console에 출력하지 않도록 설정
        sut.app.useLogger(false)
    })

    afterEach(async () => {
        if (sut) await sut.close()
    })

    it('ErrorFilter', async () => {
        const res = await req.get({
            url: '/error'
        })

        expect(res.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('HttpExceptionFilter', async () => {
        const res = await req.get({
            url: '/http-exception'
        })

        expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
    })

    it('HttpSuccessInterceptor', async () => {
        const res = await req.get({
            url: '/http-success'
        })

        expect(res.status).toEqual(HttpStatus.OK)
    })
})
