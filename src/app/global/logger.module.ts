import { Injectable, Module, OnModuleDestroy } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AppLoggerService, HttpSuccessInterceptor, LoggerConfiguration, initializeLogger } from 'common'
import { logOptions } from 'config'
import winston from 'winston'

@Injectable()
class WinstonConfigService implements OnModuleDestroy {
    private loggerInstance: winston.Logger
    private loggerSetup: Promise<void>

    constructor() {
        this.loggerSetup = this.setupLogger()
    }

    async onModuleDestroy() {
        await this.loggerSetup

        this.loggerInstance.close()
    }

    private async setupLogger() {
        this.loggerInstance = await initializeLogger(logOptions as LoggerConfiguration)
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
