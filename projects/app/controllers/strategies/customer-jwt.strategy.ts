import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { CustomersService } from 'app/services/customers'
import { AuthTokenPayload } from 'common'
import { Config } from 'config'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(private service: CustomersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Config.auth.accessSecret
        })
    }

    async validate(payload: AuthTokenPayload): Promise<AuthTokenPayload | null> {
        const exists = await this.service.customersExist([payload.userId])
        return exists ? payload : null
    }
}
