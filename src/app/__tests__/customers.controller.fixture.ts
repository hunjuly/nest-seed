import { CustomerDto } from 'app/services/customers'
import { padNumber } from 'common'
import { objToJson } from 'common/test'

export const customerCreationDto = {
    name: 'customer name',
    email: 'user@mail.com',
    birthday: new Date('2020-12-12')
}

export async function createCustomer(request: any): Promise<CustomerDto> {
    const res = await request.post({
        url: '/customers',
        body: customerCreationDto
    })

    return res.body
}

export function sortCustomers(customers: CustomerDto[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...customers].sort((a, b) => b.name.localeCompare(a.name))
    }

    return [...customers].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createManyCustomers(request: any): Promise<CustomerDto[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        createPromises.push(
            request.post({
                url: '/customers',
                body: {
                    ...customerCreationDto,
                    name: `Customer_${padNumber(i, 3)}`
                }
            })
        )
    }

    const responses = await Promise.all(createPromises)

    return sortCustomers(responses.map((res) => res.body))
}

expect.extend({
    toValidUserDto(received, expected) {
        const pass = this.equals(received, {
            id: expect.anything(),
            ...objToJson(expected)
        })

        const message = pass
            ? () => `expected CustomerDto not to match`
            : () => `expected CustomerDto to match`

        return { pass, message }
    }
})

declare module 'expect' {
    interface Matchers<R> {
        toValidUserDto(expected: any): R
    }
}
