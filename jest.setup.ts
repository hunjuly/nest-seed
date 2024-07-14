/**
 * import 'reflect-metadata'을 하지 않으면 .spec.ts에서 'class-transformer' 코드를 포함하면
 * 'TypeError: Reflect.getMetadata is not a function' 에러 발생함
 *
 * import { Type } from 'class-transformer'
 *
 * class Dto {
 *     @Type()
 *     times: Date
 * }
 *
 * describe('...', () => {})
 */
import 'reflect-metadata'

if (process.env.NODE_ENV !== 'development') {
    throw new Error('Cannot run tests in not development mode')
}

process.env.MONGOMS_DOWNLOAD_URL = 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian11-7.0.3.tgz'
process.env.MONGOMS_VERSION = '7.0.3'
