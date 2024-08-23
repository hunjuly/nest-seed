import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { ClientProxyService } from '../core/client-proxy.module'

@Injectable()
export class CustomerLocalStrategy extends PassportStrategy(Strategy, 'customer-local') {
    constructor(private service: ClientProxyService) {
        super({
            usernameField: 'email',
            passwordField: 'password'
        })
    }

    async validate(email: string, password: string) {
        /* customer is passed to the corresponding @UseGuards (LocalAuthGuard). */
        return this.service.get('getCustomerByCredentials', { email, password })
    }
}
