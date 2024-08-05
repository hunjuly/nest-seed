import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Config } from 'config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthTokenPayload } from 'common'
import { ClientProxy } from '@nestjs/microservices'

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(@Inject('CUSTOMERS_SERVICE') private readonly client: ClientProxy) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Config.auth.accessSecret
        })
    }

    async validate(payload: AuthTokenPayload) {
        return this.client.send({ cmd: 'customersExist' }, [payload.userId])
    }
}
