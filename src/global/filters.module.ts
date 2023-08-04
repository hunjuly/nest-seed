import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { ErrorFilter, HttpExceptionFilter } from 'src/common'

@Module({
    providers: [
        {
            provide: APP_FILTER,
            useClass: ErrorFilter
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter
        }
    ]
})
export class FiltersModule {}
