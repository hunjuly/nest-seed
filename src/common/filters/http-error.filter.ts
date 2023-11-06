import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(Error)
export class HttpErrorFilter implements ExceptionFilter {
    async catch(error: Error, host: ArgumentsHost) {
        // 나중에 Rpc 기능이 추가되면 아래 코드를 수정해야 한다.
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
