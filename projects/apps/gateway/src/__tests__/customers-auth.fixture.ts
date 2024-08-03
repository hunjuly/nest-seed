import { CustomersService } from 'app/services/customers'

export interface Credentials {
    customerId: string
    email: string
    password: string
}

export async function createCredentials(customersService: CustomersService): Promise<Credentials> {
    const creationDto = {
        name: 'customer name',
        email: 'user@mail.com',
        birthday: new Date('1999-12-12'),
        password: 'password'
    }

    const customer = await customersService.createCustomer(creationDto)

    const { email, password } = creationDto

    return { customerId: customer.id, email, password }
}
