import { CustomerDto } from 'app/services/customers'
import { PaymentsService } from 'app/services/payments'
import { padNumber } from 'common'

export async function createPayments(
    paymentsService: PaymentsService,
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
