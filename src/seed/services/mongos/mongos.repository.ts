import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult, defaultUUID } from 'common'
import { CreateMongoDto, MongosQueryDto } from './dto'
import { Mongo, defaultMongo } from './entities'

@Injectable()
export class MongosRepository {
    constructor() {}

    async create(createMongoDto: CreateMongoDto): Promise<Mongo> {
        return defaultMongo
    }

    async update(entity: Mongo): Promise<Mongo> {
        Assert.defined(entity.id, "Entity doesn't have id")

        return defaultMongo
    }

    async remove(entity: Mongo): Promise<void> {}

    async findById(id: string): Promise<Mongo | null> {
        return defaultMongo
    }

    async exist(id: string): Promise<boolean> {
        return id !== '00000000000000000000000000000001'
    }

    async find(queryDto: MongosQueryDto): Promise<PaginationResult<Mongo>> {
        const { take, skip } = queryDto

        return { items: [defaultMongo], total: 1, take, skip }
    }
}
