import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { CustomersService } from 'app/services/customers'

@Injectable()
export class CustomerExistsGuard implements CanActivate {
    constructor(private readonly customersService: CustomersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const customerId = request.params.customerId

        const customerExists = await this.customersService.doesCustomerExist(customerId)

        if (!customerExists) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`)
        }

        return true
    }
}