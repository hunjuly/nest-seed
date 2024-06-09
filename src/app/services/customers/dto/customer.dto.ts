import { Customer } from '../schemas'

export class CustomerDto {
    id: string
    name: string
    email: string
    birthday: Date

    constructor(customer: Customer) {
        const { _id: id, name, email, birthday } = customer

        Object.assign(this, {
            id,
            name,
            email,
            birthday
        })
    }
}
