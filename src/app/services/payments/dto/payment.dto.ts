import { Payment } from '../schemas'

export class PaymentDto {
    id: string
    customerId: string
    ticketIds: string[]

    constructor(payment: Payment) {
        const { _id, customerId, ticketIds } = payment

        Object.assign(this, { id: _id.toString(), customerId, ticketIds })
    }
}
