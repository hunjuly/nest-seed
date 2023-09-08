import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from 'src/services'
import { AccessTokenPayload } from '../interfaces'
import { AuthConfigService } from '../services'

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
