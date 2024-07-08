import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(Error)
export class HttpErrorFilter implements ExceptionFilter {
    async catch(error: Error, host: ArgumentsHost) {
        // TODO
        // Error 필터이기 때문에 Http를 포함한 모든 예외를 처리한다.
        // 그래서 나중에 gRPC 기능이 추가되면 아래 코드를 수정해야 한다.
        // 혹은 RPCErrorFilter를 따로 만들 수 있다.
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        const message = error.message
        const statusCode = HttpStatus.INTERNAL_SERVER_ERROR

        const additionalInfo = {
            statusCode,
            method: request.method,
            url: request.url,
            body: request.body
        }

        response.status(statusCode).json({ ...additionalInfo, message: 'Internal Server Error' })

        Logger.error(message, 'HTTP', { ...additionalInfo, stack: error.stack })
    }
}
