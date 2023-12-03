/* istanbul ignore file */

/**
 * 테스트 하기 어렵고 테스트 할 때 log가 출력되면 불편하기 때문에 테스트에서 제외시킨다.
 */

import * as chalk from 'chalk'
import { Path } from 'common'
import * as winston from 'winston'
import * as DailyRotateFile from 'winston-daily-rotate-file'

export interface LoggerConfiguration {
    logDirectory: string
    daysToKeepLogs: string
    fileLogLevel: string
    consoleLogLevel: string
}

export interface HttpLogInfo {
    method: string
    statusCode: string
    url: string
    body: unknown
    runningTime: string
}

export interface OrmLogInfo {
    query: string
    parameters: string
    runningTime: string
}

export async function initializeLogger(config: LoggerConfiguration) {
    const { logDirectory, daysToKeepLogs, fileLogLevel, consoleLogLevel } = config

    if (!(await Path.isWritable(logDirectory))) {
        throw new Error(`"${logDirectory}" is not writable.`)
    }

    const logFileOptions = {
        dirname: logDirectory,
        zippedArchive: false,
        maxSize: '10m',
        createSymlink: true,
        format: winston.format.combine(
            winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
            winston.format.prettyPrint()
        )
    }

    const allLogsTransport = new DailyRotateFile({
        ...logFileOptions,
        datePattern: 'YYYY-MM-DD',
        maxFiles: daysToKeepLogs,
        symlinkName: `current.log`,
        filename: `%DATE%.log`,
        level: fileLogLevel
    })

    const errorLogsTransport = new DailyRotateFile({
        ...logFileOptions,
        datePattern: 'YYYY-MM-DD',
        maxFiles: daysToKeepLogs,
        symlinkName: `errors.log`,
        filename: `err-%DATE%.log`,
        level: 'error'
    })

    const consoleTransport = new winston.transports.Console({
        format: consoleLogFormat,
        level: consoleLogLevel
    })

    const logger = winston.createLogger({
        format: winston.format.json(),
        transports: [allLogsTransport, errorLogsTransport, consoleTransport],
        exceptionHandlers: [errorLogsTransport]
    })

    return logger
}

const consoleLogFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf((info) => {
        const { message, level, timestamp, ...etc } = info

        const formattedMessage = chalk.white(message)
        const formattedLevel = colorLevels(level)
        const formattedTimestamp = chalk.gray(timestamp)

        if (info[0] === 'HTTP') {
            return formatHttpLog(formattedMessage, formattedLevel, formattedTimestamp, etc[1] ?? {})
        } else if (info[0] === 'ORM') {
            return formatOrmLog(formattedMessage, formattedLevel, formattedTimestamp, etc[1] ?? {})
        } else {
            return formatGenericLog(formattedMessage, formattedLevel, formattedTimestamp, etc ?? {})
        }
    })
)

const colorHttpMethod = (method: string) => {
    const METHOD = (method ?? 'METHOD').toUpperCase()

    switch (METHOD) {
        case 'GET':
            return chalk.cyan(METHOD)
        case 'POST':
            return chalk.yellow(METHOD)
        case 'PUT':
            return chalk.blue(METHOD)
        case 'PATCH':
            return chalk.blueBright(METHOD)
        case 'DELETE':
            return chalk.red(METHOD)
        default:
            return chalk.magenta(METHOD)
    }
}

const colorLevels = (level: string) => {
    const LEVEL = (level ?? 'LEVEL').toUpperCase()

    switch (LEVEL) {
        case 'ERROR':
            return chalk.red(LEVEL)
        case 'WARN':
            return chalk.yellow(LEVEL)
        case 'INFO':
            return chalk.cyan(LEVEL)
        default:
            return chalk.gray(LEVEL)
    }
}

const formatHttpLog = (
    formattedMessage: string,
    formattedLevel: string,
    formattedTimestamp: string,
    etc: HttpLogInfo
) => {
    const httpMethod = colorHttpMethod(etc.method)
    const httpStatus = chalk.magenta(etc.statusCode)
    const url = chalk.green(etc.url)
    const requestBody = etc.body ? chalk.blueBright(JSON.stringify(etc.body)) : ''
    const runningTime = chalk.magenta(etc.runningTime ?? '')

    return `${formattedTimestamp} HTTP ${formattedLevel} ${httpStatus} ${httpMethod} ${url} ${requestBody} ${formattedMessage}  ${runningTime}`
}

const formatOrmLog = (
    formattedMessage: string,
    formattedLevel: string,
    formattedTimestamp: string,
    etc: OrmLogInfo
) => {
    const query = chalk.green(etc.query ?? '')
    const parameters = chalk.blueBright(etc.parameters ?? '')
    const runningTime = chalk.magenta(etc.runningTime ?? '')

    return `${formattedTimestamp} ORM ${formattedLevel} ${formattedMessage} ${query} ${parameters} ${runningTime}`
}

const formatGenericLog = (
    formattedMessage: string,
    formattedLevel: string,
    formattedTimestamp: string,
    etc: unknown
) => {
    const formattedEtc = chalk.green(JSON.stringify(etc))

    return `${formattedTimestamp} ${formattedLevel} ${formattedMessage} ${formattedEtc}`
}
