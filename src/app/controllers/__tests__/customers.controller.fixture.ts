import { CustomerDto } from 'app/services/customers'
import { padNumber } from 'common'

export async function createCustomers(request: any): Promise<CustomerDto[]> {
    const promises = []

    for (let i = 0; i < 100; i++) {
        const tag = padNumber(i, 3)

        const body = {
            name: `Customer-${tag}`,
            email: `user-${tag}@mail.com`,
            birthday: new Date(2020, 1, i)
        }

        const promise = request.post({ url: '/customers', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    if (300 <= responses[0].statusCode) {
        throw new Error(JSON.stringify(responses[0].body))
    }

    return responses.map((res) => res.body)
}

export function sortByName(customers: CustomerDto[]) {
    return customers.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(customers: CustomerDto[]) {
    return customers.sort((a, b) => b.name.localeCompare(a.name))
}
