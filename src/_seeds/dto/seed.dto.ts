import { Seed, SeedEnum } from '../entities'

export class SeedDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: SeedEnum[]
    integer: number

    constructor(seed: Seed) {
        const { id, name, desc, date, enums, integer } = seed

        Object.assign(this, { id, name, desc, date, enums, integer })
    }
}
