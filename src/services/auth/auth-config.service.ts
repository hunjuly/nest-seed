import { Injectable } from '@nestjs/common'
import { SafeConfigService } from 'src/common'

@Injectable()
export class AuthConfigService {
    public readonly accessSecret: string
    public readonly accessTokenExpiration: string
    public readonly refreshSecret: string
    public readonly refreshTokenExpiration: string

    constructor(config: SafeConfigService) {
        this.accessSecret = config.getString('AUTH_ACCESS_SECRET')
        this.accessTokenExpiration = config.getString('AUTH_ACCESS_TOKEN_EXPIRATION')
        this.refreshSecret = config.getString('AUTH_REFRESH_SECRET')
        this.refreshTokenExpiration = config.getString('AUTH_REFRESH_TOKEN_EXPIRATION')
    }
}
