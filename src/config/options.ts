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

export const httpOptions = {
    requestPayloadLimit: getString('HTTP_REQUEST_PAYLOAD_LIMIT')
}

export const authOptions = {
    accessSecret: getString('AUTH_ACCESS_SECRET'),
    accessTokenExpiration: getString('AUTH_ACCESS_TOKEN_EXPIRATION'),
    refreshSecret: getString('AUTH_REFRESH_SECRET'),
    refreshTokenExpiration: getString('AUTH_REFRESH_TOKEN_EXPIRATION')
}

export const logOptions = {
    logDirectory: getString('LOG_DIRECTORY'),
    daysToKeepLogs: getString('LOG_DAYS_TO_KEEP'),
    fileLogLevel: getString('LOG_FILE_LEVEL'),
    consoleLogLevel: getString('LOG_CONSOLE_LEVEL')
}

export const redisOptions = {
    host: getString('REDIS_HOST'),
    port: getNumber('REDIS_PORT')
    // ttl: 기본값은 5
}

export const psqlOptions = {
    host: getString('POSTGRES_DB_HOST'),
    port: getNumber('POSTGRES_DB_PORT'),
    username: getString('POSTGRES_DB_USERNAME'),
    password: getString('POSTGRES_DB_PASSWORD'),
    database: getString('POSTGRES_DB_DATABASE'),
    schema: getString('POSTGRES_DB_SCHEMA'),
    poolSize: getNumber('POSTGRES_DB_POOL_SIZE')
}

export const mongoOptions = {
    host: getString('MONGO_DB_HOST'),
    port: getNumber('MONGO_DB_PORT'),
    user: getString('MONGO_DB_USERNAME'),
    pass: getString('MONGO_DB_PASSWORD'),
    database: getString('MONGO_DB_DATABASE')
}
