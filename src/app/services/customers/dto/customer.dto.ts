import { Customer } from '../schemas'

export class CustomerDto {
    id: string
    name: string
    email: string
    birthday: Date

    constructor(customer: Customer) {
        const { id, name, email, birthday } = customer

        Object.assign(this, {
            id: id.toString(),
            name,
            email,
            birthday
        })
    }
}
