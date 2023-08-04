import { Injectable, Module, OnModuleDestroy } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AppLoggerService, HttpSuccessInterceptor, SafeConfigService, initializeLogger } from 'src/common'
import winston from 'winston'

@Injectable()
class WinstonConfigService implements OnModuleDestroy {
    private loggerInstance: winston.Logger
    private loggerSetup: Promise<void>

    constructor(private config: SafeConfigService) {
        this.loggerSetup = this.setupLogger()
    }

    async onModuleDestroy() {
        await this.loggerSetup

        this.loggerInstance.close()
    }

    private async setupLogger() {
        const logDirectory = this.config.getString('LOG_DIRECTORY')
        const daysToKeepLogs = this.config.getString('LOG_DAYS_TO_KEEP')
        const fileLogLevel = this.config.getString('LOG_FILE_LEVEL')
        const consoleLogLevel = this.config.getString('LOG_CONSOLE_LEVEL')

        this.loggerInstance = await initializeLogger({
            logDirectory,
            daysToKeepLogs,
            fileLogLevel,
            consoleLogLevel
        })
    }

    async getLoggerService() {
        await this.loggerSetup

        return new AppLoggerService(this.loggerInstance)
    }
}

@Module({
    providers: [
        WinstonConfigService,
        {
            provide: AppLoggerService,
            useFactory: (winstonConfigService: WinstonConfigService) => {
                return winstonConfigService.getLoggerService()
            },
            inject: [WinstonConfigService]
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpSuccessInterceptor
        }
    ]
})
export class LoggerModule {}
