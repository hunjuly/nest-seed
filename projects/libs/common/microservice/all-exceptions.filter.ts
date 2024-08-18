import { ArgumentsHost, Catch, HttpException, RpcExceptionFilter } from '@nestjs/common'
import { Observable, of, throwError } from 'rxjs'

@Catch()
export class AllExceptionsFilter implements RpcExceptionFilter<any> {
    catch(exception: any, _host: ArgumentsHost): Observable<any> {
        let error = exception

        if (exception instanceof HttpException) {
            error = { status: exception.getStatus(), message: exception.message }
        } else {
            error = { status: 500, message: 'Internal server error' }
        }

        return throwError(() => error);
    }
}
