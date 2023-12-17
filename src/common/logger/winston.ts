/* istanbul ignore file */

/**
 * 테스트 하기 어렵고 테스트 할 때 log가 출력되면 불편하기 때문에 테스트에서 제외시킨다.
 */

import { Path } from 'common'
import * as winston from 'winston'
import * as DailyRotateFile from 'winston-daily-rotate-file'
import { consoleLogFormat } from './console-log.format'

export interface LoggerConfiguration {
    logDirectory: string
    daysToKeepLogs: string
    fileLogLevel: string
    consoleLogLevel: string
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
