import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Config } from 'config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { CustomersRepository } from '../customers.repository'
import { AuthTokenPayload } from 'app/services/jwt-auth'

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(private customersRepository: CustomersRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Config.auth.accessSecret
        })
    }

    async validate(payload: AuthTokenPayload): Promise<AuthTokenPayload | null> {
        const exists = await this.customersRepository.existsById(payload.userId)

        return exists ? payload : null
    }
}
