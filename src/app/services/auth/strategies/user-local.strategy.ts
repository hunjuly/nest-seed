import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { UserAuthService } from '../auth.service'

@Injectable()
export class UserLocalStrategy extends PassportStrategy(Strategy, 'user-local') {
    constructor(private authService: UserAuthService) {
        super({
            usernameField: 'email',
            passwordField: 'password'
        })
    }

    async validate(email: string, password: string): Promise<any> {
        const user = await this.authService.getUserWithPassword(email, password)

        /* user is passed to the corresponding @UseGuards (LocalAuthGuard). */
        return user
    }
}
