import { ArgumentsHost, Catch, RpcExceptionFilter } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Observable, of } from 'rxjs'

@Catch()
export class AllExceptionsFilter implements RpcExceptionFilter<any> {
    catch(exception: any, _host: ArgumentsHost): Observable<any> {
        let error: any

        if (exception instanceof RpcException) {
            error = exception.getError()
        } else {
            error = {
                status: exception.status || 500,
                message: exception.message || 'Internal server error'
            }
        }

        return of(error)
    }
}
