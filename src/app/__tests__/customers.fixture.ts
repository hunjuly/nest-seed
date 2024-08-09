import { HttpClient } from 'common/test'
import { omit } from 'lodash'

export const makeCustomerDtos = (overrides = {}) => {
    const createDto = {
        name: 'name',
        email: 'name@mail.com',
        birthday: new Date('2020-12-12'),
        password: 'password',
        ...overrides
    }

    const expectedDto = { id: expect.anything(), ...omit(createDto, 'password') }

    return { createDto, expectedDto }
}

export const createCustomer = async (client: HttpClient, override = {}) => {
    const { createDto } = makeCustomerDtos(override)
    const { body } = await client.post('/customers', false).body(createDto).created()
    return body
}

export const createCustomers = async (client: HttpClient, length: number = 20) => {
    return Promise.all(
        Array.from({ length }, async (_, index) =>
            createCustomer(client, {
                name: `Customer-${index}`,
                email: `user-${index}@mail.com`
            })
        )
    )
}
