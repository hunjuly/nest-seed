import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Config } from 'config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { CustomersRepository } from '../customers.repository'
import { AccessTokenPayload } from '../interfaces'

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(private customersRepository: CustomersRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Config.auth.accessSecret
        })
    }

    async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload | null> {
        const exists = await this.customersRepository.existsById(payload.customerId)

        return exists ? payload : null
    }
}
