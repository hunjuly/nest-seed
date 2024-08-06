import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppLoggerService } from 'common'
import { ServicesModule } from './services.module'
import { AllExceptionsFilter } from './all-exceptions.filter'

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(ServicesModule, {
        transport: Transport.TCP,
        options: { retryAttempts: 5, retryDelay: 3000, port: 3000, host: '0.0.0.0' }
    })

    const logger = app.get(AppLoggerService)
    app.useLogger(logger)
    app.useGlobalFilters(new AllExceptionsFilter())

    await app.listen()

    console.log(`Application is running on: 0.0.0.0:3000`)
}

bootstrap()
