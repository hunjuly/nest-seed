import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { firstValueFrom } from 'rxjs'
import { CustomerDto } from 'services/customers'
import { CUSTOMERS_SERVICE } from '../constants'

@Injectable()
export class CustomerLocalStrategy extends PassportStrategy(Strategy, 'customer-local') {
    constructor(@Inject(CUSTOMERS_SERVICE) private readonly client: ClientProxy) {
        super({
            usernameField: 'email',
            passwordField: 'password'
        })
    }

    async validate(email: string, password: string) {
        /* customer is passed to the corresponding @UseGuards (LocalAuthGuard). */
        return firstValueFrom(
            this.client.send<CustomerDto | null>({ cmd: 'validatePassword' }, { email, password })
        )
    }
}
