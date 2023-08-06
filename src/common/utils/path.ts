import * as syncFs from 'fs'
import * as fs from 'fs/promises'
import { tmpdir } from 'os'
import * as p from 'path'

export class Path {
    public static async getAbsolute(src: string): Promise<string> {
        // resolve 함수는 상대 경로를 절대 경로로 변환
        return p.isAbsolute(src) ? src : p.resolve(src)
    }

    public static join(...paths: string[]): string {
        return p.join(...paths)
    }

    public static basename(path: string): string {
        return p.basename(path)
    }

    public static dirname(path: string): string {
        return p.dirname(path)
    }

    public static async isWritable(path: string): Promise<boolean> {
        try {
            await fs.access(path, fs.constants.W_OK)

            return true
        } catch {
            return false
        }
    }

    public static isExistsSync(path: string): boolean {
        return syncFs.existsSync(path)
    }

    public static async isExists(path: string): Promise<boolean> {
        try {
            await fs.access(path)

            return true
        } catch {
            return false
        }
    }

    public static async isDirectory(path: string): Promise<boolean> {
        const stats = await fs.stat(path)

        return stats.isDirectory()
    }

    // Directory operations
    public static async mkdir(path: string): Promise<void> {
        await fs.mkdir(path, { recursive: true })
    }

    public static async remove(path: string): Promise<void> {
        if (await this.isExists(path)) {
            await fs.rm(path, { recursive: true, force: true })
        }
    }

    public static async subdirs(src: string): Promise<string[]> {
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

    // File operations
    public static async copyFileOrDir(src: string, dest: string): Promise<void> {
        if (await this.isDirectory(src)) {
            await this.mkdir(dest)
            const items = await fs.readdir(src)

            for (const item of items) {
                await this.copyFileOrDir(this.join(src, item), this.join(dest, item))
            }
        } else {
            await fs.copyFile(src, dest)
        }
    }

    public static async createTempDirectory(): Promise<string> {
        return await fs.mkdtemp(`${tmpdir()}${this.sep()}`)
    }

    // The platform-specific file separator. '\\' or '/'.
    public static sep() {
        return p.sep
    }
}
