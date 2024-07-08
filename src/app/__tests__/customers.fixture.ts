import { CustomerDto, CustomersService } from 'app/services/customers'
import { padNumber } from 'common'

export async function createCustomer(customersService: CustomersService): Promise<CustomerDto> {
    return customersService.createCustomer({
        name: 'customer name',
        email: 'user@mail.com',
        birthday: new Date('1999-12-12')
    })
}

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
