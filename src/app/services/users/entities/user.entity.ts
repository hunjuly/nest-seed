import { Exclude } from 'class-transformer'
import { TypeormEntity } from 'common'
import { Column, Entity } from 'typeorm'

@Entity()
export class User extends TypeormEntity {
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
