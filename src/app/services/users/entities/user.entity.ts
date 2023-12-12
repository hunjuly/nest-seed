import { Exclude } from 'class-transformer'
import { Typeorm } from 'common'
import { Column, Entity } from 'typeorm'

@Entity()
export class User extends Typeorm.AggregateRoot {
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
