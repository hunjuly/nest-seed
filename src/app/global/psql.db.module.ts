import { Logger, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeormLogger } from 'common'
import { isDevelopment } from 'config'
import { psqlConnectionOptions } from 'databases/psql'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

const psqlModuleConfig = (): PostgresConnectionOptions => {
    const logger = new TypeormLogger()

    // 설정은 했는데 동작하는 것을 못봤다.
    const poolErrorHandler = (err: any) => Logger.error('poolErrorHandler', err)

    const options = {
        ...psqlConnectionOptions,
        dropSchema: isDevelopment(),
        synchronize: isDevelopment(),
        logNotifications: true,
        logger,
        poolErrorHandler
    }

    return options
}

@Module({
    imports: [TypeOrmModule.forRootAsync({ useFactory: psqlModuleConfig })]
})
export class PsqlDbModule {}
