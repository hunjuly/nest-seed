import { StorageFilesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { StorageFilesModule, StorageFilesService } from 'app/services/storage-files'
import { nullObjectId, Path } from 'common'
import { createHttpTestContext, HttpRequest, HttpTestContext } from 'common/test'
import { Config } from 'config'
import { createReadStream } from 'fs'
import { writeFile } from 'fs/promises'

jest.mock('config', () => ({
    ...jest.requireActual('config'),
    Config: {
        ...jest.requireActual('config').Config,
        fileUpload: {
            directory: './uploads',
            maxFileSizeBytes: 1024 * 1024 * 100,
            maxFilesPerUpload: 2,
            allowedMimeTypes: ['image/*', 'text/plain']
        }
    }
}))

describe('/storage-files', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let storageFilesService: StorageFilesService
    let uploadDir: string
    let testFiles: { path: string; checksum: string }[]
    let notAllowFilePath: string

    beforeAll(async () => {
        const testFilesDir = await Path.createTempDirectory()
        testFiles = await Promise.all([
            createTestFile(testFilesDir, 'large.txt', Config.fileUpload.maxFileSizeBytes - 1),
            createTestFile(testFilesDir, 'small.txt', 1024)
        ])

        notAllowFilePath = Path.join(testFilesDir, 'file.json')
        await writeFile(notAllowFilePath, '{"name":"nest-seed"}')
    })

    afterAll(async () => {
        await Promise.all(testFiles.map((file) => Path.delete(file.path)))
    })

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, StorageFilesModule],
            controllers: [StorageFilesController]
        })
        req = testContext.createRequest()
        storageFilesService = testContext.module.get(StorageFilesService)
        uploadDir = await Path.createTempDirectory()
        Config.fileUpload.directory = uploadDir
    })

    afterEach(async () => {
        await testContext?.close()
        await Path.delete(uploadDir)
    })

    async function createTestFile(dir: string, name: string, size: number) {
        const path = Path.join(dir, name)
        await Path.createDummyFile(path, size)
        const checksum = await Path.getFileChecksum(createReadStream(path))
        return { path, checksum }
    }

    async function uploadFile(filePath: string, name = 'test') {
        return req
            .post('/storage-files')
            .attachs([{ name: 'files', file: filePath }])
            .fields([{ name: 'name', value: name }])
            .created()
    }

    async function getFileChecksum(fileId: string) {
        const readStream = await storageFilesService.getFileStream(fileId)
        return Path.getFileChecksum(readStream!)
    }

    describe('POST /storage-files', () => {
        it('업로드한 파일과 저장된 파일이 같아야 한다', async () => {
            const res = await uploadFile(testFiles[0].path)
            const uploadedFileId = res.body.files[0].id
            const savedFileChecksum = await getFileChecksum(uploadedFileId)
            expect(savedFileChecksum).toEqual(testFiles[0].checksum)
        })

        it('여러 개의 파일을 업로드 해야 한다', async () => {
            const res = await req
                .post('/storage-files')
                .attachs([
                    { name: 'files', file: testFiles[0].path },
                    { name: 'files', file: testFiles[1].path }
                ])
                .fields([{ name: 'name', value: 'test' }])
                .created()

            expect(await getFileChecksum(res.body.files[0].id)).toEqual(testFiles[0].checksum)
            expect(await getFileChecksum(res.body.files[1].id)).toEqual(testFiles[1].checksum)
        })

        it('파일 첨부를 하지 않아도 업로드는 성공해야 한다', async () => {
            await req
                .post('/storage-files')
                .attachs([])
                .fields([{ name: 'name', value: 'test' }])
                .created()
        })

        it('허용된 파일 크기를 초과하는 업로드는 실패해야 한다', async () => {
            const oversizedFilePath = await createTestFile(
                uploadDir,
                'oversized.txt',
                Config.fileUpload.maxFileSizeBytes + 1
            )

            await req
                .post('/storage-files')
                .attachs([{ name: 'files', file: oversizedFilePath.path }])
                .payloadTooLarge()
        })

        it('허용된 파일 개수를 초과하는 업로드는 실패해야 한다', async () => {
            const excessFiles = Array(Config.fileUpload.maxFilesPerUpload + 1).fill({
                name: 'files',
                file: testFiles[1].path
            })

            await req.post('/storage-files').attachs(excessFiles).badRequest()
        })

        it('허용되지 않은 Mime-Type의 업로드는 실패해야 한다', async () => {
            await req
                .post('/storage-files')
                .attachs([{ name: 'files', file: notAllowFilePath }])
                .badRequest()
        })
    })
    describe('GET /storage-files/:fileId', () => {
        let uploadedFileId: string
        let savedFileChecksum: string

        beforeEach(async () => {
            const res = await uploadFile(testFiles[0].path)
            uploadedFileId = res.body.files[0].id
            savedFileChecksum = await getFileChecksum(uploadedFileId)
        })

        it('다운로드한 파일과 저장된 파일은 동일해야 한다', async () => {
            const downloadPath = Path.join(uploadDir, 'download.txt')
            await req.get(`/storage-files/${uploadedFileId}`).download(downloadPath).ok()
            const downloadedFileChecksum = await Path.getFileChecksum(
                createReadStream(downloadPath)
            )

            expect(savedFileChecksum).toEqual(downloadedFileChecksum)
        })

        it('NOT_FOUND(404) if file is not found', async () => {
            await req.get(`/storage-files/${nullObjectId}`).notFound()
        })
    })

    describe('DELETE /storage-files/:fileId', () => {
        let uploadedFileId: string

        beforeEach(async () => {
            const res = await uploadFile(testFiles[0].path)
            uploadedFileId = res.body.files[0].id
        })

        it('Delete a file', async () => {
            await req.delete(`/storage-files/${uploadedFileId}`).ok()
            await req.get(`/storage-files/${uploadedFileId}`).notFound()
        })

        it('NOT_FOUND(404) if file is not found', async () => {
            return req.delete(`/storage-files/${nullObjectId}`).notFound()
        })
    })
})
