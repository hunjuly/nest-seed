import { createDummyFile, createMicroserviceTestContext, getChecksum, Path } from 'common'
import { Config } from 'config'
import { ServicesModule } from '../services.module'

export const maxFileSizeBytes = 1024 * 1024 * 100

export const createFixture = async () => {
    Config.fileUpload = {
        directory: await Path.createTempDirectory(),
        maxFileSizeBytes: 0,
        maxFilesPerUpload: 0,
        allowedMimeTypes: []
    }

    const tempDir = await Path.createTempDirectory()

    const file1 = {
        originalname: 'file1.txt',
        mimetype: 'text/plain',
        size: 1024,
        uploadedFilePath: Path.join(tempDir, 'file1.txt')
    }
    await createDummyFile(file1.uploadedFilePath, file1.size)
    const file1Checksum = await getChecksum(file1.uploadedFilePath)

    const file2 = {
        originalname: 'file2.txt',
        mimetype: 'text/plain',
        size: 2048,
        uploadedFilePath: Path.join(tempDir, 'file2.txt')
    }
    await createDummyFile(file2.uploadedFilePath, file2.size)
    const file2Checksum = await getChecksum(file2.uploadedFilePath)

    const testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
    const client = testContext.client

    return { testContext, client, tempDir, file1, file1Checksum, file2, file2Checksum }
}
