import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

/**
 * 사용자의 요청이 성공적으로 처리되었다.
 * throw exception이 발생한 요청은 exception.filter에서 처리한다.
 */
@Injectable()
export class HttpSuccessInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const now = Date.now()

        const request = context.switchToHttp().getRequest()
        const response = context.switchToHttp().getResponse()

        return next.handle().pipe(
            tap({
                complete: () => {
                    const additionalInfo = {
                        statusCode: response.statusCode,
                        method: request.method,
                        url: request.url,
                        runningTime: `${Date.now() - now}ms`
                    }

                    Logger.verbose('SUCCESS', 'HTTP', additionalInfo)
                }
            })
        )
    }
}
