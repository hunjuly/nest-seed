import {
    CanActivate,
    ConflictException,
    ExecutionContext,
    Inject,
    Injectable
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import { CUSTOMERS_SERVICE } from '../../constants'

@Injectable()
export class CustomerEmailNotExistsGuard implements CanActivate {
    constructor(@Inject(CUSTOMERS_SERVICE) private client: ClientProxy) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const email = request.body.email

        if (email) {
            const customer = await firstValueFrom(this.client.send({ cmd: 'findByEmail' }, email))

            if (customer) {
                throw new ConflictException(`Customer with email ${email} already exists`)
            }
        }

        return true
    }
}
