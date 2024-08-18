import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AllExceptionsFilter, AppLoggerService } from 'common'
import { matchesEnv } from 'config'
import { ServicesModule } from './services.module'

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

if (matchesEnv('development') || matchesEnv('production')) {
    bootstrap()
} else {
    console.error('NODE_ENV is not set. Exiting...')
    process.exit(1)
}
