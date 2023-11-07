import { AggregateRoot, defaultUUID } from 'common'
import { Column, Entity } from 'typeorm'

export enum PsqlEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Entity()
export class Psql extends AggregateRoot {
    @Column()
    name: string

    @Column({ type: 'text' })
    desc: string

    @Column({ type: 'integer' })
    integer: number

    @Column('varchar', { array: true })
    enums: PsqlEnum[]

    @Column({ type: 'timestamptz' })
    date: Date
}

// export const defaultPsql: Psql = {
//     name: 'name',
//     desc: 'desc',
//     integer: 0,
//     enums: [],
//     date: new Date(0),
//     id: defaultUUID,
//     createdAt: new Date(0),
//     updatedAt: new Date(0),
//     version: 0
// }
