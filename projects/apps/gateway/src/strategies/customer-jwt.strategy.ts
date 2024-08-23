import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { AuthTokenPayload } from 'common'
import { Config } from 'config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ClientProxyService } from '../core/client-proxy.module'

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(private service: ClientProxyService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Config.auth.accessSecret
        })
    }

    async validate(payload: AuthTokenPayload): Promise<AuthTokenPayload | null> {
        const exists = await this.service.get('customersExist', [payload.userId])
        return exists ? payload : null
    }
}
