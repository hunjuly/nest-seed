import { Logger, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeormLogger } from 'common'
import { isDevelopment } from 'config'
import { psqlConnectionOptions } from 'databases/psql'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

const psqlModuleConfig = (): PostgresConnectionOptions => {
    const dropSchema = isDevelopment()
    const synchronize = isDevelopment()

    const logger = new TypeormLogger()
    // 설정은 했는데 동작하는 것을 못봤다.
    const poolErrorHandler = (err: any) => Logger.error('poolErrorHandler', err)
    const logNotifications = true

    const options = {
        ...psqlConnectionOptions,
        dropSchema,
        synchronize,
        logger,
        poolErrorHandler,
        logNotifications
    }

    return options as PostgresConnectionOptions
}

@Module({
    imports: [TypeOrmModule.forRootAsync({ useFactory: psqlModuleConfig })]
})
export class PsqlDbModule {}
