import { CustomerDocument } from '../schemas'

export class CustomerDto {
    id: string
    name: string
    email: string
    birthday: Date

    constructor(customer: CustomerDocument) {
        const { id, name, email, birthday } = customer

        Object.assign(this, {
            id,
            name,
            email,
            birthday
        })
    }
}
