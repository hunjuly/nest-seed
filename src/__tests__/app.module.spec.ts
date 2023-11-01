import { HttpStatus } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { createHttpTestingModule } from 'src/common/test'

describe('AppModule', () => {
    let module: TestingModule
    let request: any

    beforeEach(async () => {
        const sut = await createHttpTestingModule({
            imports: [AppModule]
        })

        module = sut.module
        request = sut.request
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(request).toBeDefined()
    })

    it('GET /', async () => {
        const res = await request.get({
            url: '/'
        })

        expect(res.status).toEqual(HttpStatus.OK)
    })
})
