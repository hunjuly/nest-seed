import { AggregateRoot, defaultUUID } from 'src/common'
import { Column, Entity } from 'typeorm'

export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Entity()
export class Mongo extends AggregateRoot {
    @Column()
    name: string

    @Column({ type: 'text' })
    desc: string

    @Column({ type: 'integer' })
    integer: number

    @Column('varchar', { array: true })
    enums: MongoEnum[]

    @Column({ type: 'timestamptz' })
    date: Date
}

export const defaultMongo: Mongo = {
    name: 'name',
    desc: 'desc',
    integer: 0,
    enums: [],
    date: new Date(0),
    id: defaultUUID,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    version: 0
}
