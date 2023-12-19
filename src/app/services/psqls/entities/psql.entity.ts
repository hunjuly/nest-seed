import { TypeormEntity } from 'common'
import { Column, Entity } from 'typeorm'

export enum PsqlEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Entity()
export class Psql extends TypeormEntity {
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
