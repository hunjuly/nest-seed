import { Payment } from '../schemas'

export class PaymentDto {
    id: string
    customerId: string
    ticketIds: string[]

    constructor(payment: Payment) {
        const { id, customerId, ticketIds } = payment

        Object.assign(this, { id: id.toString(), customerId, ticketIds })
    }
}
