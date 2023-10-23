import { AggregateRoot } from 'src/common'
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
