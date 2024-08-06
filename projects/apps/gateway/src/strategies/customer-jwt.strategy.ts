import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PassportStrategy } from '@nestjs/passport'
import { AuthTokenPayload } from 'common'
import { Config } from 'config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { CUSTOMERS_SERVICE } from '../constants'

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(@Inject(CUSTOMERS_SERVICE) private readonly client: ClientProxy) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Config.auth.accessSecret
        })
    }

    async validate(payload: AuthTokenPayload) {
        const exists = await this.client.send({ cmd: 'customersExist' }, [payload.userId])
        return exists ? payload : null
    }
}
