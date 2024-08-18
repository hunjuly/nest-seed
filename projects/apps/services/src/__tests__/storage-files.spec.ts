import { HttpStatus } from '@nestjs/common'
import { MicroserviceClient, MicroserviceTestContext, nullObjectId, Path } from 'common'
import { Config } from 'config'
import { CreateStorageFileDto, StorageFileDto } from '../storage-files'
import { createFixture } from './storage-files.fixture'

describe('/storage-files', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient
    let tempDir: string
    let file1: CreateStorageFileDto
    let file1Checksum: string
    let file2: CreateStorageFileDto
    let file2Checksum: string

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        client = fixture.client
        tempDir = fixture.tempDir
        file1 = fixture.file1
        file1Checksum = fixture.file1Checksum
        file2 = fixture.file2
        file2Checksum = fixture.file2Checksum
    })

    afterEach(async () => {
        await testContext?.close()
        await Path.delete(Config.fileUpload.directory)
        await Path.delete(tempDir)
    })

    describe('saveFiles', () => {
        it('Should return CREATED(201) when uploaded file is identical to stored file', async () => {
            const [uploadedFile] = await client.send('saveFiles', [file1])
            expect(uploadedFile.checksum).toEqual(file1Checksum)
        })

        it('Should allow uploading multiple files', async () => {
            const uploadedFiles = await client.send('saveFiles', [file1, file2])
            expect(uploadedFiles[0].checksum).toEqual(file1Checksum)
            expect(uploadedFiles[1].checksum).toEqual(file2Checksum)
        })

        it('Should return CREATED(201) when upload is successful even with no file attached', async () => {
            const uploadedFiles = await client.send('saveFiles', [])
            expect(uploadedFiles).toHaveLength(0)
        })
    })

    describe('getStorageFile', () => {
        let uploadedFile: StorageFileDto

        beforeEach(async () => {
            const uploadedFiles = await client.send('saveFiles', [file1])
            uploadedFile = uploadedFiles[0]
        })

        it('should get a file', async () => {
            const storageFile = await client.send('getStorageFile', uploadedFile.id)
            expect(uploadedFile).toEqual(storageFile)
        })

        it('should return NOT_FOUND(404) when file does not exist', async () => {
            await client.error('getStorageFile', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('deleteStorageFile', () => {
        let uploadedFile: StorageFileDto

        beforeEach(async () => {
            const uploadedFiles = await client.send('saveFiles', [file1])
            uploadedFile = uploadedFiles[0]
        })

        it('should delete a file', async () => {
            expect(Path.existsSync(uploadedFile.storedPath)).toBeTruthy()

            await client.send('deleteStorageFile', uploadedFile.id)
            await client.error('deleteStorageFile', uploadedFile.id, HttpStatus.NOT_FOUND)

            expect(Path.existsSync(uploadedFile.storedPath)).toBeFalsy()
        })

        it('should return NOT_FOUND(404) when file does not exist', async () => {
            await client.error('deleteStorageFile', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })
})
