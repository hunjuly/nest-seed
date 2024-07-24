import { StorageFilesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { StorageFilesModule, StorageFilesService } from 'app/services/storage-files'
import { Path } from 'common'
import { createHttpTestContext, HttpRequest, HttpTestContext } from 'common/test'
import { Config } from 'config'
import { createReadStream } from 'fs'

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
    let showtimesService: StorageFilesService
    let uploadDir: string
    let testFilesDir: string
    let testFilePath1: string
    let testFileChecksum1: string
    let testFilePath2: string
    let testFileChecksum2: string

    beforeAll(async () => {
        testFilesDir = await Path.createTempDirectory()

        testFilePath1 = Path.join(testFilesDir, 'large.txt')
        await Path.createDummyFile(testFilePath1, Config.fileUpload.maxFileSizeBytes - 1)
        testFileChecksum1 = await Path.getFileChecksum(createReadStream(testFilePath1))

        testFilePath2 = Path.join(testFilesDir, 'small.txt')
        await Path.createDummyFile(testFilePath2, 1024)
        testFileChecksum2 = await Path.getFileChecksum(createReadStream(testFilePath2))
    })
    afterAll(async () => {
        await Path.delete(testFilesDir)
    })

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, StorageFilesModule],
            controllers: [StorageFilesController]
        })
        req = testContext.request
        showtimesService = testContext.module.get(StorageFilesService)

        uploadDir = await Path.createTempDirectory()
        Config.fileUpload.directory = uploadDir
    })

    afterEach(async () => {
        await testContext?.close()
        await Path.delete(uploadDir)
    })

    it('업로드한 파일과 저장된 파일이 같아야 한다', async () => {
        const res = await req
            .post('/storage-files')
            .attachs([{ name: 'files', file: testFilePath1 }])
            .fields([{ name: 'name', value: 'test' }])
            .created()

        const uploadedFile = res.body.files[0]
        const readStream = await showtimesService.getFileStream(uploadedFile.id)
        const checksum1 = await Path.getFileChecksum(readStream!)

        expect(checksum1).toEqual(testFileChecksum1)
    })

    it('다운로드한 파일과 저장된 파일은 동일해야 한다', async () => {
        const res = await req
            .post('/storage-files')
            .attachs([{ name: 'files', file: testFilePath1 }])
            .fields([{ name: 'name', value: 'test' }])
            .created()

        const uploadedFile = res.body.files[0]
        const readStream = await showtimesService.getFileStream(uploadedFile.id)
        const checksum1 = await Path.getFileChecksum(readStream!)

        const downloadPath = Path.join(uploadDir, 'download.txt')
        await req.get(`/storage-files/${uploadedFile.id}`).download(downloadPath).ok()

        const checksum2 = await Path.getFileChecksum(createReadStream(downloadPath))

        expect(checksum1).toEqual(checksum2)
    })

    it('여러 개의 파일을 업로드 해야 한다', async () => {
        const res = await req
            .post('/storage-files')
            .attachs([
                { name: 'files', file: testFilePath1 },
                { name: 'files', file: testFilePath2 }
            ])
            .fields([{ name: 'name', value: 'test' }])
            .created()

        const readStream1 = await showtimesService.getFileStream(res.body.files[0].id)
        const checksum1 = await Path.getFileChecksum(readStream1!)
        expect(checksum1).toEqual(testFileChecksum1)

        const readStream2 = await showtimesService.getFileStream(res.body.files[1].id)
        const checksum2 = await Path.getFileChecksum(readStream2!)
        expect(checksum2).toEqual(testFileChecksum2)
    })

    it('파일 첨부를 하지 않아도 업로드는 성공해야 한다', async () => {
        return req
            .post('/storage-files')
            .attachs([])
            .fields([{ name: 'name', value: 'test' }])
            .created()
    })

    it('허용된 파일 크기를 초과하는 업로드는 실패해야 한다', async () => {
        const filePath = Path.join(uploadDir, 'file.txt')
        await Path.createDummyFile(filePath, 1024 * 1024 * 100)

        return req
            .post('/storage-files')
            .attachs([{ name: 'files', file: filePath }])
            .payloadTooLarge()
    })

    it('허용된 파일 개수를 초과하는 업로드는 실패해야 한다', async () => {
        const filePath = Path.join(uploadDir, 'file.txt')
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
