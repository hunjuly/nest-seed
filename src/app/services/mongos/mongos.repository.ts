import { Injectable } from '@nestjs/common'
import { PaginationResult, defaultPaginationResult } from 'common'
import { MongosQueryDto } from './dto'
import { Mongo, defaultMongo } from './entities'

@Injectable()
export class MongosRepository<T> {
    constructor() {}

    async create(entityData: Partial<T>): Promise<T> {
        return defaultMongo as T
    }

    async update(entity: T): Promise<T> {
        return defaultMongo as T
    }

    async remove(entity: T): Promise<void> {}

    async findById(id: string): Promise<T | null> {
        return null
    }

    async findByIds(ids: string[]): Promise<T[]> {
        return []
    }

    async exist(id: string): Promise<boolean> {
        return false
    }

    async find(queryDto: MongosQueryDto): Promise<PaginationResult<Mongo>> {
        return defaultPaginationResult
    }
}
