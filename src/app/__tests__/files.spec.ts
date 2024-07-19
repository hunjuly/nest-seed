import { FilesController } from 'app/controllers/files.controller'
import { createHttpTestContext, HttpRequest, HttpTestContext } from 'common/test'

jest.mock('config', () => {
    const { Config, ...rest } = jest.requireActual('config')

    return {
        ...rest,
        Config: {
            ...Config,
            fileUpload: {
                directory: './uploads',
                maxFileSizeBytes: 1024 * 1024 * 1,
                maxFilesPerUpload: 2,
                allowedMimeTypes: ['image/*', 'application/json']
            }
        }
    }
})

describe('E2E FileTest', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    beforeEach(async () => {
        testContext = await createHttpTestContext({ controllers: [FilesController] })
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

        // expect(res.body).toEqual({
        //     body: { name: 'test' },
        //     file: readFileSync('./package.json').toString()
        // })
    })

    it('should allow for file uploads that pass validation', async () => {
        const res = await req
            .post('/file/pass-validation')
            .attachs([{ name: 'file', file: './package.json' }])
            .fields([{ name: 'name', value: 'test' }])
            .created()

        // expect(res.body).toEqual({
        //     body: { name: 'test' },
        //     file: readFileSync('./package.json').toString()
        // })
    })

    it('should throw for file uploads that do not pass validation', async () => {
        return req
            .post('/file/fail-validation')
            .attachs([{ name: 'file', file: './package.json' }])
            .fields([{ name: 'name', value: 'test' }])
            .badRequest()
    })

    it('should throw when file is required but no file is uploaded', async () => {
        return req.post('/file/fail-validation').badRequest()
    })

    it('should allow for optional file uploads with validation enabled (fixes #10017)', () => {
        return req.post('/file/pass-validation').created()
    })
})
