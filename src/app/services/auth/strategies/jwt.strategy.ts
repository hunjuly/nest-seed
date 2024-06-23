import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { UsersService } from 'app/services/users'
import { authOptions } from 'config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AccessTokenPayload } from '../interfaces'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: authOptions.accessSecret
        })
    }

    async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload | null> {
        const userExists = await this.usersService.userExists(payload.userId)

        return userExists ? payload : null
    }
}
