import { MicroserviceClient } from 'common'
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

export const createCustomer = (client: MicroserviceClient, override = {}) => {
    const { createDto } = makeCustomerDto(override)
    return client.send('createCustomer', createDto)
}

export const createCustomers = async (client: MicroserviceClient, length: number = 20) => {
    return Promise.all(
        Array.from({ length }, async (_, index) =>
            createCustomer(client, {
                name: `Customer-${index}`,
                email: `user-${index}@mail.com`
            })
        )
    )
}
