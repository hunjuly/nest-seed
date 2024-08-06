import { MicroserviceClient } from 'common/test'
import { omit } from 'lodash'

export const makeCustomerDtos = (override = {}) => {
    const createDto = {
        name: 'name',
        email: 'name@mail.com',
        birthday: new Date('2020-12-12'),
        password: 'password',
        ...override
    }

    const expectedDto = { id: expect.anything(), ...omit(createDto, 'password') }

    return { createDto, expectedDto }
}

export const createCustomer = (client: MicroserviceClient, override = {}) => {
    const { createDto } = makeCustomerDtos(override)
    return client.send('createCustomer', createDto)
}

export const createCustomers = async (client: MicroserviceClient, length: number) => {
    return Promise.all(
        Array.from({ length }, async (_, index) =>
            createCustomer(client, {
                name: `Customer-${index}`,
                email: `user-${index}@mail.com`
            })
        )
    )
}
