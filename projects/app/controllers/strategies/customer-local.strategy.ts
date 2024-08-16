import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { CustomersService } from 'app/services/customers'
import { Strategy } from 'passport-local'

@Injectable()
export class CustomerLocalStrategy extends PassportStrategy(Strategy, 'customer-local') {
    constructor(private service: CustomersService) {
        super({
            usernameField: 'email',
            passwordField: 'password'
        })
    }

    async validate(email: string, password: string) {
        /* customer is passed to the corresponding @UseGuards (LocalAuthGuard). */
        return this.service.getCustomerByCredentials(email, password)
    }
}
