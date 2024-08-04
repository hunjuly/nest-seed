import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Password } from 'common'
import { Strategy } from 'passport-local'
import { CustomersRepository } from '../customers.repository'
import { CustomerDto } from '../dto'

@Injectable()
export class CustomerLocalStrategy extends PassportStrategy(Strategy, 'customer-local') {
    constructor(private customersRepository: CustomersRepository) {
        super({
            usernameField: 'email',
            passwordField: 'password'
        })
    }

    async validate(email: string, password: string): Promise<any> {
        const customer = await this.customersRepository.findByEmail(email)

        if (customer) {
            if (await Password.validate(password, customer.password))
                return new CustomerDto(customer)
        }

        /* customer is passed to the corresponding @UseGuards (LocalAuthGuard). */
        return null
    }
}
