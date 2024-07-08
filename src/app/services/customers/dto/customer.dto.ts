import { Customer } from '../schemas'

export class CustomerDto {
    id: string
    name: string
    email: string
    birthday: Date

    constructor(customer: Customer) {
        const { _id, name, email, birthday } = customer

        Object.assign(this, {
            id: _id.toString(),
            name,
            email,
            birthday
        })
    }
}
