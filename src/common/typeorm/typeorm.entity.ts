import { PrimaryGeneratedColumn } from 'typeorm'

export abstract class TypeormEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string
}
