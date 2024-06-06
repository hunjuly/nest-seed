import { Module, ValidationPipe } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { HttpErrorFilter, HttpExceptionFilter } from 'common'

@Module({
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
            provide: APP_PIPE,
            useFactory: () =>
                new ValidationPipe({
                    enableDebugMessages: false, // Changing it to true doesn't make any difference.
                    disableErrorMessages: false,
                    whitelist: true, // Properties without decorators will be removed.
                    skipMissingProperties: false, // If set to true, the validator will skip validation of all properties that are null or undefined in the validation object.
                    forbidNonWhitelisted: true, // Instead of removing non-whitelisted properties, the validator will throw an exception.
                    forbidUnknownValues: true, // Default value, any attempt to validate an unknown object will fail immediately.
                    transform: true,
                    transformOptions: {
                        enableImplicitConversion: true // Setting it to false will cause an error in @InInt().
                    }
                })
        }
    ]
})
export class HttpModule {}
