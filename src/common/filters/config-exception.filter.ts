import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { ConfigException } from '../exceptions'

@Catch(ConfigException)
export class ConfigExceptionFilter implements ExceptionFilter {
    /* istanbul ignore next */
    catch(exception: ConfigException, _host: ArgumentsHost) {
        console.log(exception.message, exception.stack)
    }
}
