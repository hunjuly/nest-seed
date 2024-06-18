import { CustomerDto, CustomersService } from 'app/services/customers'
import { padNumber } from 'common'

export async function createCustomers(
    customersService: CustomersService,
    count: number
): Promise<CustomerDto[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const tag = padNumber(i, 3)

        const promise = customersService.createCustomer({
            name: `Customer-${tag}`,
            email: `user-${tag}@mail.com`,
            birthday: new Date(2020, 1, i)
        })

        promises.push(promise)
    }

    const customers = await Promise.all(promises)

    return customers
}

export function sortByName(customers: CustomerDto[]) {
    return customers.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(customers: CustomerDto[]) {
    return customers.sort((a, b) => b.name.localeCompare(a.name))
}
