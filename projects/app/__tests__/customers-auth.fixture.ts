import { createCustomer } from './customers.fixture'
import { HttpClient } from 'common'

export interface Credentials {
    customerId: string
    email: string
    password: string
}

export async function createCredentials(client: HttpClient): Promise<Credentials> {
    const createDto = {
        email: 'user@mail.com',
        password: 'password'
    }

    const customer = await createCustomer(client, createDto)

    return {
        customerId: customer.id,
        email: createDto.email,
        password: createDto.password
    }
}
