import { CustomerDocument } from '../schemas'

export class CustomerDto {
    id: string
    name: string
    date: Date

    constructor(customer: CustomerDocument) {
        const { id, name, date } = customer

        Object.assign(this, {
            id,
            name,
            date
        })
    }
}
