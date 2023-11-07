import { BadRequestException, Controller, Get, Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { HttpErrorFilter } from '../http-error.filter'
import { HttpExceptionFilter } from '../http-exception.filter'

@Controller('')
class TestController {
    @Get('error')
    async throwError() {
        throw new Error('test')
    }
    @Get('http-exception')
    async throwHttpException() {
        throw new BadRequestException('http-exception')
    }
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
        }
    ]
})
export class TestModule {}
