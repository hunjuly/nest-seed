import { FilesController } from 'app/controllers/files.controller'
import { createHttpTestContext, HttpRequest, HttpTestContext } from 'common/test'
import { readFileSync } from 'fs'

describe('E2E FileTest', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            controllers: [FilesController]
        })
        req = testContext.request
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('should allow for file uploads', async () => {
        const res = await req
            .post('/file')
            .attachs([{ name: 'file', file: './package.json' }])
            .fields([{ name: 'name', value: 'test' }])
            .created()

        expect(res.body).toEqual({
            body: { name: 'test' },
            file: readFileSync('./package.json').toString()
        })
    })

    // it('should allow for file uploads that pass validation', async () => {
    //     return request(app.getHttpServer())
    //         .post('/file/pass-validation')
    //         .attach('file', './package.json')
    //         .field('name', 'test')
    //         .expect(201)
    //         .expect({
    //             body: {
    //                 name: 'test'
    //             },
    //             file: readFileSync('./package.json').toString()
    //         })
    // })

    // it('should throw for file uploads that do not pass validation', async () => {
    //     return request(app.getHttpServer())
    //         .post('/file/fail-validation')
    //         .attach('file', './package.json')
    //         .field('name', 'test')
    //         .expect(400)
    // })

    // it('should throw when file is required but no file is uploaded', async () => {
    //     return request(app.getHttpServer()).post('/file/fail-validation').expect(400)
    // })

    // it('should allow for optional file uploads with validation enabled (fixes #10017)', () => {
    //     return request(app.getHttpServer()).post('/file/pass-validation').expect(201)
    // })
})
