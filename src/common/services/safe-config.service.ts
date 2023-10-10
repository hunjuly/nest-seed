import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ConfigException } from '../exceptions'

@Injectable()
export class SafeConfigService {
    constructor(private config: ConfigService) {}

    getString(key: string) {
        const value = this.config.get<string>(key)

        if (!value) throw new ConfigException(`${key} has not been configured.`)

        return value
    }

    getNumber(key: string) {
        const value = this.config.get<string>(key)

        if (!value) throw new ConfigException(`${key} has not been configured.`)

        const number = parseInt(value)

        if (isNaN(number)) throw new ConfigException(`${key} not number`)

        return number
    }

    getBoolean(key: string) {
        const value = this.config.get<string>(key)

        if (!value) throw new ConfigException(`${key} has not been configured.`)

        if (value.toLowerCase() === 'true') return true
        if (value.toLowerCase() === 'false') return false

        throw new ConfigException(`${key} not boolean`)
    }
}
