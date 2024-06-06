import { CanActivate, ExecutionContext, Injectable, ConflictException } from '@nestjs/common'
import { CustomersService } from 'app/services/customers'

@Injectable()
export class CustomerEmailNotExistsGuard implements CanActivate {
    constructor(private readonly customersService: CustomersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const email = request.body.email

        if (email) {
            const customer = await this.customersService.findByEmail(email)

            if (customer) {
                throw new ConflictException(`Customer with email ${email} already exists`)
            }
        }

        return true
    }
}
