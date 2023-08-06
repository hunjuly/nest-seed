import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ConfigException } from '../exceptions'

@Injectable()
export class SafeConfigService {
    constructor(private config: ConfigService) {}

    getString(key: string) {
        const value = this.config.get<string>(key)

        if (!value) throw new ConfigException(`${key} undefined`)

        return value
    }

    getNumber(key: string) {
        const value = this.config.get<string>(key)

        if (!value) throw new ConfigException(`${key} undefined`)

        const number = parseInt(value)

        if (isNaN(number)) throw new ConfigException(`${key} not number`)

        return number
    }

    getBoolean(key: string) {
        const value = this.config.get<string>(key)

        if (!value) throw new ConfigException(`${key} undefined`)

        if (value.toLowerCase() === 'true') return true
        if (value.toLowerCase() === 'false') return false

        throw new ConfigException(`${key} not boolean`)
    }
}
