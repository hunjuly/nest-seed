import * as dotenv from 'dotenv'
import { getNumber, getString } from './utils'

export function isProduction() {
    return process.env.NODE_ENV === 'production'
}

export function isDevelopment() {
    return process.env.NODE_ENV === 'development'
}

if (isDevelopment()) {
    dotenv.config({ path: '.env.development' })
}

export const Config = {
    http: {
        requestPayloadLimit: getString('HTTP_REQUEST_PAYLOAD_LIMIT'),
        paginationMaxSize: getNumber('HTTP_PAGINATION_MAX_SIZE'),
        paginationDefaultSize: getNumber('HTTP_PAGINATION_DEFAULT_SIZE')
    },
    auth: {
        accessSecret: getString('AUTH_ACCESS_SECRET'),
        accessTokenExpiration: getString('AUTH_ACCESS_TOKEN_EXPIRATION'),
        refreshSecret: getString('AUTH_REFRESH_SECRET'),
        refreshTokenExpiration: getString('AUTH_REFRESH_TOKEN_EXPIRATION')
    },
    log: {
        logDirectory: getString('LOG_DIRECTORY'),
        daysToKeepLogs: getString('LOG_DAYS_TO_KEEP'),
        fileLogLevel: getString('LOG_FILE_LEVEL'),
        consoleLogLevel: getString('LOG_CONSOLE_LEVEL')
    },
    redis: {
        host: getString('REDIS_HOST'),
        port: getNumber('REDIS_PORT')
        // ttl: defaults to 5
    },
    psql: {
        host: getString('POSTGRES_DB_HOST'),
        port: getNumber('POSTGRES_DB_PORT'),
        username: getString('POSTGRES_DB_USERNAME'),
        password: getString('POSTGRES_DB_PASSWORD'),
        database: getString('POSTGRES_DB_DATABASE'),
        schema: getString('POSTGRES_DB_SCHEMA'),
        poolSize: getNumber('POSTGRES_DB_POOL_SIZE')
    },
    mongo: {
        host: getString('MONGO_DB_HOST'),
        port: getNumber('MONGO_DB_PORT'),
        replica: getString('MONGO_DB_REPLICA_NAME'),
        user: getString('MONGO_DB_USERNAME'),
        pass: getString('MONGO_DB_PASSWORD'),
        database: getString('MONGO_DB_DATABASE')
    },
    fileUpload: {
        directory: getString('FILE_UPLOAD_DIRECTORY'),
        maxFileSizeBytes: getNumber('FILE_UPLOAD_MAX_FILE_SIZE_BYTES'),
        maxFilesPerUpload: getNumber('FILE_UPLOAD_MAX_FILES_PER_UPLOAD'),
        allowedMimeTypes: getString('FILE_UPLOAD_ALLOWED_FILE_TYPES').split(',')
    }
}
