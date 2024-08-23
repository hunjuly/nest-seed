import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ClientProxyService } from 'common'
import { Strategy } from 'passport-local'

@Injectable()
export class CustomerLocalStrategy extends PassportStrategy(Strategy, 'customer-local') {
    constructor(private service: ClientProxyService) {
        super({
            usernameField: 'email',
            passwordField: 'password'
        })
    }

    async validate(email: string, password: string) {
        return this.service.getValue('getCustomerByCredentials', { email, password })
    }
}
