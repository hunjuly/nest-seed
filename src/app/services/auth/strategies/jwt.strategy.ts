import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../../users'
import { AccessTokenPayload } from '../interfaces'
import { authOptions } from 'config'

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
