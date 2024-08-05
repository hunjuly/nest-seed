import { NestFactory } from '@nestjs/core'
import { AppLoggerService } from 'common'
import * as compression from 'compression'
import { Config } from 'config'
import * as express from 'express'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.use(compression())

    const limit = Config.http.requestPayloadLimit
    app.use(express.json({ limit }))
    app.use(express.urlencoded({ limit, extended: true }))

    const logger = app.get(AppLoggerService)
    app.useLogger(logger)

    const port = 3001

    await app.listen(port)

    console.log(`Application is running on: ${await app.getUrl()}`)
}

bootstrap()
