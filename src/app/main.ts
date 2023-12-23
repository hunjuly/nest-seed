import { NestFactory } from '@nestjs/core'
import { AppLoggerService } from 'common'
import { httpOptions, isDevelopment, isProduction } from 'config'
import * as express from 'express'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const limit = httpOptions.requestPayloadLimit

    app.use(express.json({ limit }))
    app.use(express.urlencoded({ limit, extended: true }))

    const logger = app.get(AppLoggerService)
    app.useLogger(logger)

    const port = process.env.PORT ?? 3000

    await app.listen(port)

    console.log(`Application is running on: ${await app.getUrl()}`)
}

if (isDevelopment() || isProduction()) {
    bootstrap()
} else {
    console.error('NODE_ENV is not set. Exiting...')
    process.exit(1)
}
