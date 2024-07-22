import { StorageFilesController } from 'app/controllers'
import { Path } from 'common'
import { createHttpTestContext, HttpRequest, HttpTestContext } from 'common/test'
import { Config } from 'config'

jest.mock('config', () => {
    const { Config, ...rest } = jest.requireActual('config')

    return {
        ...rest,
        Config: {
            ...Config,
            fileUpload: {
                directory: './uploads',
                maxFileSizeBytes: 1024 * 1024 * 100,
                maxFilesPerUpload: 2,
                allowedMimeTypes: ['image/*', 'application/json', 'text/plain']
            }
        }
    }
})

describe('/storage-files', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let tempDir: string

    beforeEach(async () => {
        testContext = await createHttpTestContext({ controllers: [StorageFilesController] })
        req = testContext.request
        tempDir = await Path.createTempDirectory()

        Config.fileUpload.directory = tempDir
    })

    afterEach(async () => {
        await testContext?.close()
        await Path.delete(tempDir)
    })

    it('업로드한 파일과 저장된 파일은 동일해야 한다', async () => {
        const filePath = Path.join(tempDir, 'file.txt')
        await Path.createDummyFile(filePath, 1024 * 1024 * 100 - 1)

        const res = await req
            .post('/storage-files')
            .attachs([{ name: 'files', file: filePath }])
            .fields([{ name: 'name', value: 'test' }])
            .created()

        const checksum1 = await Path.getFileChecksum(res.body.files[0].path)
        const checksum2 = await Path.getFileChecksum(filePath)
        expect(checksum1).toEqual(checksum2)
    })

    it('여러 개의 파일을 업로드 해야 한다', async () => {
        const filePath1 = Path.join(tempDir, 'file1.txt')
        await Path.createDummyFile(filePath1, 1024)
        const filePath2 = Path.join(tempDir, 'file2.txt')
        await Path.createDummyFile(filePath2, 2048)

        const res = await req
            .post('/storage-files')
            .attachs([
                { name: 'files', file: filePath1 },
                { name: 'files', file: filePath2 }
            ])
            .fields([{ name: 'name', value: 'test' }])
            .created()

        const checksum1 = await Path.getFileChecksum(res.body.files[0].path)
        const checksum2 = await Path.getFileChecksum(filePath1)
        expect(checksum1).toEqual(checksum2)

        const checksum3 = await Path.getFileChecksum(res.body.files[1].path)
        const checksum4 = await Path.getFileChecksum(filePath2)
        expect(checksum3).toEqual(checksum4)
    })

    it('파일 첨부를 하지 않아도 업로드는 성공해야 한다', async () => {
        return req
            .post('/storage-files')
            .attachs([])
            .fields([{ name: 'name', value: 'test' }])
            .created()
    })

    it('허용된 파일 크기를 초과하는 업로드는 실패해야 한다', async () => {
        const filePath = Path.join(tempDir, 'file.txt')
        await Path.createDummyFile(filePath, 1024 * 1024 * 100)

        return req
            .post('/storage-files')
            .attachs([{ name: 'files', file: filePath }])
            .payloadTooLarge()
    })

    it('허용된 파일 개수를 초과하는 업로드는 실패해야 한다', async () => {
        const filePath = Path.join(tempDir, 'file.txt')
        await Path.createDummyFile(filePath, 1024)

        return req
            .post('/storage-files')
            .attachs([
                { name: 'files', file: filePath },
                { name: 'files', file: filePath },
                { name: 'files', file: filePath }
            ])
            .badRequest()
    })
})
