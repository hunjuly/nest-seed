import { AggregateRoot } from 'src/common'
// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
// import { HydratedDocument } from 'mongoose'

// export type CatDocument = HydratedDocument<Cat>

// @Schema()
// export class Cat  {
//     @Prop()
//     name: string

//     @Prop()
//     age: number

//     @Prop()
//     breed: string
// }

// export const CatSchema = SchemaFactory.createForClass(Cat)
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
