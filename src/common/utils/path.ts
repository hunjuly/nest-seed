import { createHash, Hash } from 'crypto'
import * as syncFs from 'fs'
import { ReadStream } from 'fs'
import * as fs from 'fs/promises'
import { tmpdir } from 'os'
import * as p from 'path'
import { pipeline, Writable } from 'stream'
import { promisify } from 'util'

const promisifiedPipeline = promisify(pipeline)

export class Path {
    static async getAbsolute(src: string): Promise<string> {
        // resolve function converts relative paths to absolute paths
        return p.isAbsolute(src) ? src : p.resolve(src)
    }

    static join(...paths: string[]): string {
        return p.join(...paths)
    }

    static basename(path: string): string {
        return p.basename(path)
    }

    static dirname(path: string): string {
        return p.dirname(path)
    }

    static async isWritable(path: string): Promise<boolean> {
        try {
            await fs.access(path, fs.constants.W_OK)

            return true
        } catch {
            return false
        }
    }

    static existsSync(path: string): boolean {
        return syncFs.existsSync(path)
    }

    static async exists(path: string): Promise<boolean> {
        try {
            await fs.access(path)

            return true
        } catch {
            return false
        }
    }

    static async isDirectory(path: string): Promise<boolean> {
        const stats = await fs.stat(path)
        return stats.isDirectory()
    }

    static async getFileSize(filePath: string) {
        const stats = await fs.stat(filePath)
        return stats.size
    }

    static async mkdir(path: string): Promise<void> {
        await fs.mkdir(path, { recursive: true })
    }

    static async delete(path: string): Promise<void> {
        await fs.rm(path, { recursive: true, force: true })
    }

    static async subdirs(src: string): Promise<string[]> {
        const res: string[] = []

        const items = await fs.readdir(src)

        for (const item of items) {
            const itemPath = this.join(src, item)

            if (await this.isDirectory(itemPath)) {
                res.push(item)
            }
        }

        return res
    }

    static async copy(src: string, dest: string): Promise<void> {
        if (await this.isDirectory(src)) {
            await this.mkdir(dest)
            const items = await fs.readdir(src)

            for (const item of items) {
                await this.copy(this.join(src, item), this.join(dest, item))
            }
        } else {
            await fs.copyFile(src, dest)
        }
    }

    static async createTempDirectory(): Promise<string> {
        return await fs.mkdtemp(`${tmpdir()}${this.sep()}`)
    }

    static sep() {
        return p.sep
    }

    static async getFileChecksum(
        readStream: ReadStream,
        algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'md5'
    ): Promise<string> {
        const hash: Hash = createHash(algorithm)

        await promisifiedPipeline(readStream, hash as unknown as Writable)

        return hash.digest('hex')
    }

    static async createDummyFile(filePath: string, sizeInBytes: number) {
        const file = await fs.open(filePath, 'w')

        let remainingBytes = sizeInBytes

        const buffer = Buffer.alloc(
            1024 * 1024,
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ가나다라마바사아자차카타파하~!@#$%^&*()_+'
        )

        try {
            while (remainingBytes > 0) {
                const currentChunkSize = Math.min(buffer.byteLength, remainingBytes)

                await file.write(buffer, 0, currentChunkSize)
                remainingBytes -= currentChunkSize
            }
        } finally {
            await file.sync()
            await file.close()
        }

        return filePath
    }

    static async move(src: string, dest: string): Promise<void> {
        // rename may fail if moving to a different file-system
        await fs.rename(src, dest)
    }
}
