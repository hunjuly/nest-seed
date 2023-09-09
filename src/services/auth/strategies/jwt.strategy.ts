import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../../users'
import { AuthConfigService } from '../auth-config.service'
import { AccessTokenPayload } from '../interfaces'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService, config: AuthConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.accessSecret
        })
    }

    async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload | null> {
        const userExists = await this.usersService.userExists(payload.userId)

        return userExists ? payload : null
    }
}
