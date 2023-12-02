import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PaginationResult } from 'common'
import { Model } from 'mongoose'
import { MongosQueryDto } from './dto'
import { Mongo, defaultMongo } from './schemas'

// https://github.com/nestjs/nest/blob/master/sample/06-mongoose/src/cats/cats.service.ts

abstract class BaseRepository<T> {
    constructor(protected typeorm: Model<T>) {}

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
}

@Injectable()
export class MongosRepository extends BaseRepository<Mongo> {
    constructor(@InjectModel(Mongo.name) model: Model<Mongo>) {
        super(model)
    }

    async exist(id: string): Promise<boolean> {
        return false
    }

    async find(queryDto: MongosQueryDto): Promise<PaginationResult<Mongo>> {
        const defaultPaginationResult: PaginationResult<any> = {
            skip: undefined,
            take: undefined,
            total: 0,
            items: []
        }

        return defaultPaginationResult
    }
}
