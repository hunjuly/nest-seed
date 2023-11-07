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
                    enableDebugMessages: false, // true로 해도 변하는 게 없다.
                    disableErrorMessages: false,
                    whitelist: true, // 데코레이터가 없는 프로퍼티는 제거합니다.
                    skipMissingProperties: false, // true로 설정하면 유효성 검사기는 유효성 검사 개체에서 null 또는 정의되지 않은 모든 속성의 유효성 검사를 건너뜁니다.
                    forbidNonWhitelisted: true, // 화이트리스트가 아닌 속성을 제거하는 대신 유효성 검사기는 예외를 던질 것이다.
                    forbidUnknownValues: true, // 기본값, 알 수 없는 객체를 검증하려는 시도는 즉시 실패합니다.
                    transform: true,
                    transformOptions: {
                        enableImplicitConversion: true //false로 설정하면 @InInt()에서 에러다.
                    }
                })
        }
    ]
})
export class HttpModule {}
