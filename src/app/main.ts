import { NestFactory } from '@nestjs/core'
import * as express from 'express'
import { AppLoggerService, Env } from 'common'
import { AppModule } from './app.module'
import { httpOptions } from 'config'

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

if (Env.isDevelopment() || Env.isProduction()) {
    bootstrap()
} else {
    console.error('NODE_ENV is not set. Exiting...')
    process.exit(1)
}
