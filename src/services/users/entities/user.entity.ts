import { Exclude } from 'class-transformer'
import { AggregateRoot } from 'src/common'
import { Column, Entity } from 'typeorm'

@Entity()
export class User extends AggregateRoot {
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
