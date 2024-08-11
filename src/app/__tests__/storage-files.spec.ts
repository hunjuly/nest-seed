import { StorageFilesController } from 'app/controllers'
import { CoreModule } from 'app/core'
import { StorageFilesModule } from 'app/services/storage-files'
import { StorageFileDto } from 'app/services/storage-files/dto'
import { getChecksum, nullObjectId, Path } from 'common'
import { createDummyFile, createHttpTestContext, HttpClient, HttpTestContext } from 'common/test'
import { Config } from 'config'
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
    let req: HttpClient

    let tempDir: string
    let notAllowFile: string
    let oversizedFile: string
    let largeFile: string
    let smallFile: string

    beforeAll(async () => {
        tempDir = await Path.createTempDirectory()

        largeFile = Path.join(tempDir, 'large.txt')
        await createDummyFile(largeFile, Config.fileUpload.maxFileSizeBytes - 1)

        smallFile = Path.join(tempDir, 'small.txt')
        await createDummyFile(smallFile, 1024)

        notAllowFile = Path.join(tempDir, 'file.json')
        await writeFile(notAllowFile, '{"name":"nest-seed"}')

        oversizedFile = Path.join(tempDir, 'oversized.txt')
        await createDummyFile(oversizedFile, Config.fileUpload.maxFileSizeBytes + 1)
    })

    afterAll(async () => {
        await Path.delete(tempDir)
    })

    beforeEach(async () => {
        Config.fileUpload.directory = await Path.createTempDirectory()

        testContext = await createHttpTestContext({
            imports: [CoreModule, StorageFilesModule],
            controllers: [StorageFilesController]
        })
        req = testContext.createClient()
    })

    afterEach(async () => {
        await testContext?.close()
        await Path.delete(Config.fileUpload.directory)
    })

    async function uploadFile(filePath: string, name = 'test') {
        return req
            .post('/storage-files')
            .attachs([{ name: 'files', file: filePath }])
            .fields([{ name: 'name', value: name }])
            .created()
    }

    describe('POST /storage-files', () => {
        // it('업로드한 파일과 저장된 파일이 같아야 한다', async () => {
        it('tetsetadfadsf', async () => {
            const res = await uploadFile(largeFile)
            const uploadedFile = res.body.files[0]
            expect(uploadedFile.checksum).toEqual(await getChecksum(largeFile))
        })

        it('여러 개의 파일을 업로드 해야 한다', async () => {
            const res = await req
                .post('/storage-files')
                .attachs([
                    { name: 'files', file: largeFile },
                    { name: 'files', file: smallFile }
                ])
                .fields([{ name: 'name', value: 'test' }])
                .created()

            expect(res.body.files[0].checksum).toEqual(await getChecksum(largeFile))
            expect(res.body.files[1].checksum).toEqual(await getChecksum(smallFile))
        })

        it('파일 첨부를 하지 않아도 업로드는 성공해야 한다', async () => {
            await req
                .post('/storage-files')
                .attachs([])
                .fields([{ name: 'name', value: 'test' }])
                .created()
        })

        it('허용된 파일 크기를 초과하는 업로드는 실패해야 한다', async () => {
            await req
                .post('/storage-files')
                .attachs([{ name: 'files', file: oversizedFile }])
                .payloadTooLarge()
        })

        it('허용된 파일 개수를 초과하는 업로드는 실패해야 한다', async () => {
            const limitOver = Config.fileUpload.maxFilesPerUpload + 1
            const excessFiles = Array(limitOver).fill({ name: 'files', file: smallFile })

            await req.post('/storage-files').attachs(excessFiles).badRequest()
        })

        it('허용되지 않은 Mime-Type의 업로드는 실패해야 한다', async () => {
            await req
                .post('/storage-files')
                .attachs([{ name: 'files', file: notAllowFile }])
                .badRequest()
        })
    })
    describe('GET /storage-files/:fileId', () => {
        let uploadedFile: StorageFileDto

        beforeEach(async () => {
            const res = await uploadFile(largeFile)
            uploadedFile = res.body.files[0]
        })

        it('다운로드한 파일과 저장된 파일은 동일해야 한다', async () => {
            const downloadPath = Path.join(tempDir, 'download.txt')

            await req.get(`/storage-files/${uploadedFile.id}`).download(downloadPath).ok()

            expect(uploadedFile.checksum).toEqual(await getChecksum(downloadPath))
        })

        it('NOT_FOUND(404) if file is not found', async () => {
            await req.get(`/storage-files/${nullObjectId}`).notFound()
        })
    })

    describe('DELETE /storage-files/:fileId', () => {
        let uploadedFile: StorageFileDto

        beforeEach(async () => {
            const res = await uploadFile(largeFile)
            uploadedFile = res.body.files[0]
        })

        it('Delete a file', async () => {
            const filePath = Path.join(Config.fileUpload.directory, `${uploadedFile.id}.file`)
            expect(Path.existsSync(filePath)).toBeTruthy()

            await req.delete(`/storage-files/${uploadedFile.id}`).ok()
            await req.get(`/storage-files/${uploadedFile.id}`).notFound()

            expect(Path.existsSync(filePath)).toBeFalsy()
        })

        it('NOT_FOUND(404) if file is not found', async () => {
            return req.delete(`/storage-files/${nullObjectId}`).notFound()
        })
    })
})
