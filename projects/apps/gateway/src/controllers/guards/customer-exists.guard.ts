import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    NotFoundException
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import { CUSTOMERS_SERVICE } from '../../constants'

@Injectable()
export class CustomerExistsGuard implements CanActivate {
    constructor(@Inject(CUSTOMERS_SERVICE) private readonly client: ClientProxy) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const customerId = request.query.customerId || request.params.customerId

        const customerExists = await firstValueFrom(
            this.client.send({ cmd: 'customersExist' }, [customerId])
        )

        if (!customerExists) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`)
        }

        return true
    }
}
