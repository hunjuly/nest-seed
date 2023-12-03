import { Exclude } from 'class-transformer'
import { TypeormAggregateRoot } from 'common'
import { Column, Entity } from 'typeorm'

@Entity()
export class User extends TypeormAggregateRoot {
    @Column({ unique: true })
    email: string

    @Column()
    @Exclude()
    password: string

    @Column({ type: 'timestamptz' })
    birthdate: Date

    @Column()
    username: string

    @Column()
    firstName: string

    @Column()
    lastName: string
}
