import { PrimaryGeneratedColumn } from 'typeorm'

export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id: number
}

export type BaseEntityId = number
