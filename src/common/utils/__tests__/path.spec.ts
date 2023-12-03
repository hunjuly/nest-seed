import * as fs from 'fs/promises'
import * as os from 'os'
import * as p from 'path'
import { Path } from '..'

describe('Path', () => {
    let tempDir: string

    beforeEach(async () => {
        tempDir = await Path.createTempDirectory()
    })

    afterEach(async () => {
        await Path.remove(tempDir)
        jest.restoreAllMocks()
    })

    it('tempDir이 존재해야 한다.', async () => {
        const exists = await Path.isExists(tempDir)
        expect(exists).toBe(true)

        // ensure it's under OS temp directory
        expect(tempDir.startsWith(os.tmpdir())).toBe(true)
    })

    it('지정된 경로가 존재하는지 올바르게 확인해야 합니다.', async () => {
        const filePath = Path.join(tempDir, 'testfile.txt')
        await fs.writeFile(filePath, 'hello world')

        const exists = await Path.isExists(filePath)
        expect(exists).toBe(true)
    })

    it('지정된 경로가 존재하는지 올바르게 확인해야 합니다(sync).', async () => {
        const filePath = Path.join(tempDir, 'testfile.txt')
        await fs.writeFile(filePath, 'hello world')

        const exists = await Path.isExistsSync(filePath)
        expect(exists).toBe(true)
    })

    it('지정된 경로가 디렉토리인지 올바르게 확인해야 합니다.', async () => {
        const exists = await Path.isDirectory(tempDir)
        expect(exists).toBe(true)
    })

    it('디렉토리를 올바르게 생성, 삭제 및 재생성해야 합니다.', async () => {
        const dirPath = Path.join(tempDir, 'testdir')

        await Path.mkdir(dirPath)
        let exists = await Path.isExists(dirPath)
        expect(exists).toBe(true)

        await Path.remove(dirPath)
        exists = await Path.isExists(dirPath)
        expect(exists).toBe(false)
    })

    it('하위 디렉토리를 올바르게 나열해야 합니다.', async () => {
        const subDir1 = Path.join(tempDir, 'subdir1')
        const subDir2 = Path.join(tempDir, 'subdir2')
        await Path.mkdir(subDir1)
        await Path.mkdir(subDir2)

        const subDirs = await Path.subdirs(tempDir)
        expect(subDirs).toEqual(expect.arrayContaining(['subdir1', 'subdir2']))
    })

    it('파일을 올바르게 복사해야 한다', async () => {
        const srcFilePath = Path.join(tempDir, 'testfile.txt')
        await fs.writeFile(srcFilePath, 'hello world')

        const destFilePath = Path.join(tempDir, 'testfile_copy.txt')
        await Path.copyFileOrDir(srcFilePath, destFilePath)

        const copiedExists = await Path.isExists(destFilePath)
        expect(copiedExists).toBe(true)

        // check the contents of the copied file
        const content = await fs.readFile(destFilePath, 'utf-8')
        expect(content).toBe('hello world')
    })

    it('디렉토리를 올바르게 복사해야 한다', async () => {
        const srcDirPath = Path.join(tempDir, 'testdir')
        await Path.mkdir(srcDirPath)

        const fileInSrcDirPath = Path.join(srcDirPath, 'testfile.txt')
        await fs.writeFile(fileInSrcDirPath, 'hello from the original dir')

        const destDirPath = Path.join(tempDir, 'testdir_copy')
        await Path.copyFileOrDir(srcDirPath, destDirPath)

        const copiedDirExists = await Path.isExists(destDirPath)
        expect(copiedDirExists).toBe(true)

        // check that the file was also copied
        const copiedFilePath = Path.join(destDirPath, 'testfile.txt')
        const copiedFileExists = await Path.isExists(copiedFilePath)
        expect(copiedFileExists).toBe(true)

        // check the contents of the copied file
        const content = await fs.readFile(copiedFilePath, 'utf-8')
        expect(content).toBe('hello from the original dir')
    })

    it('절대 경로를 반환해야 한다', async () => {
        const relativePath = `.${Path.sep()}testfile.txt`
        const absolutePath = await Path.getAbsolute(relativePath)

        expect(p.isAbsolute(absolutePath)).toBe(true)
    })

    it('이미 절대 경로인 경우에는 그대로 반환한다', async () => {
        const absolutePath = p.join(os.tmpdir(), 'testfile.txt')
        const result = await Path.getAbsolute(absolutePath)

        expect(result).toBe(absolutePath)
    })

    it('basename을 반환해야 한다', () => {
        const path = 'dir/file.txt'
        const basename = Path.basename(path)

        expect(basename).toBe('file.txt')
    })

    it('dirname을 반환해야 한다', () => {
        const path = 'dir/file.txt'
        const dirname = Path.dirname(path)

        expect(dirname).toBe('dir')
    })

    describe('isWritable', () => {
        it('경로가 쓰기 가능할 경우 true를 반환해야 합니다', async () => {
            jest.spyOn(fs, 'access').mockResolvedValueOnce(undefined)

            const result = await Path.isWritable('/test/path')

            expect(result).toBe(true)
            expect(fs.access).toHaveBeenCalledWith('/test/path', fs.constants.W_OK)
        })

        it('경로가 쓰기 불가능할 경우 false를 반환해야 합니다', async () => {
            jest.spyOn(fs, 'access').mockRejectedValueOnce(new Error('Not writable'))

            const result = await Path.isWritable('/test/path')

            expect(result).toBe(false)
            expect(fs.access).toHaveBeenCalledWith('/test/path', fs.constants.W_OK)
        })
    })
})
