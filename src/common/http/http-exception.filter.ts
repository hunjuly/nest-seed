import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        const statusCode = exception.getStatus()
        const responseBody = exception.getResponse()

        response.status(statusCode).json(responseBody)

        const message = exception.message

        const additionalInfo = {
            statusCode,
            request: {
                method: request.method,
                url: request.url,
                body: request.body
            },
            response: responseBody
        }

        // 여기에 2xx, 5xx 에러는 올 수 없다.
        // 2xx는 예외가 아니고 5xx는 error-exception.filter.ts에서 처리한다.
        Logger.warn(message, 'HTTP', { ...additionalInfo, stack: exception.stack })
    }
}
