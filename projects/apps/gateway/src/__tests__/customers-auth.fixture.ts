import { HttpClient } from 'common'
import { omit } from 'lodash'

export const makeCustomerDto = (overrides = {}) => {
    const createDto = {
        name: 'name',
        email: 'name@mail.com',
        birthdate: new Date('2020-12-12'),
        password: 'password',
        ...overrides
    }

    const expectedDto = { id: expect.anything(), ...omit(createDto, 'password') }

    return { createDto, expectedDto }
}

export const createCustomer = async (client: HttpClient, override = {}) => {
    const { createDto } = makeCustomerDto(override)
    const { body } = await client.post('/customers').body(createDto).created()
    return body
}

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
