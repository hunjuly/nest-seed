import { BadRequestException, Controller, Get, Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { HttpErrorFilter } from '../http-error.filter'
import { HttpExceptionFilter } from '../http-exception.filter'
import { HttpSuccessInterceptor } from '../http-success.interceptor'

@Controller('/')
class TestController {
    @Get('error')
    async throwError() {
        throw new Error('test')
    }

    @Get('http-exception')
    async throwHttpException() {
        throw new BadRequestException('http-exception')
    }

    @Get('http-success')
    async responseSuccess() {}
}

@Module({
    controllers: [TestController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: HttpErrorFilter
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpSuccessInterceptor
        }
    ]
})
export class TestModule {}
