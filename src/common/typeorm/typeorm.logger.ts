import { Logger as NestLogger } from '@nestjs/common'
import { Logger as ILogger, QueryRunner } from 'typeorm'

export class TypeormLogger implements ILogger {
    constructor() {}

    logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
        NestLogger.verbose('QUERY', 'ORM', { query, parameters })
    }

    logQueryError(error: string | Error, query: string, parameters?: any[], _queryRunner?: QueryRunner) {
        const message = error instanceof Error ? error.message : error

        NestLogger.error(message, 'ORM', { query, parameters })
    }

    logQuerySlow(runningTime: number, query: string, parameters?: any[], _queryRunner?: QueryRunner) {
        NestLogger.warn('Slow Query', 'ORM', { query, parameters, runningTime })
    }

    logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
        NestLogger.log(message, 'ORM')
    }

    logMigration(message: string, _queryRunner?: QueryRunner) {
        NestLogger.log(message, 'ORM')
    }

    log(level: 'warn' | 'info', message: any, _queryRunner?: QueryRunner) {
        if (level === 'warn') {
            NestLogger.warn(message, 'ORM')
        } else if (level === 'info') {
            NestLogger.log(message, 'ORM')
        }
    }
}
