import {
    CallHandler,
    Controller,
    ExecutionContext,
    Injectable,
    Module,
    NestInterceptor,
    NotFoundException,
    ValidationPipe
} from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { MessagePattern } from '@nestjs/microservices'
import { Type } from 'class-transformer'
import { IsString, IsNotEmpty, IsEmail, IsDate } from 'class-validator'
import { HttpErrorFilter, HttpExceptionFilter, HttpSuccessInterceptor } from '../../http'
import { CoreModule } from 'core'
import { Observable } from 'rxjs'

export class CreateSampleDto {
    @IsString()
    @IsNotEmpty()
    name: string
}

@Controller()
class SampleController {
    constructor() {}

    @MessagePattern({ cmd: 'throwHttpException' })
    async throwHttpException() {
        throw new NotFoundException('not found exception')
    }

    @MessagePattern({ cmd: 'throwError' })
    async getMessage() {
        throw new Error('error')
    }

    @MessagePattern({ cmd: 'createSample' })
    async createSample(createDto: CreateSampleDto) {
        return createDto
    }
}

@Module({
    controllers: [SampleController],
    providers: [{ provide: APP_PIPE, useFactory: () => new ValidationPipe() }]
})
export class SampleModule {}
