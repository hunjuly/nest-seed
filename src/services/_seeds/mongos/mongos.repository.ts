import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Assert, BaseRepository, PaginationResult } from 'src/common'
import { Repository } from 'typeorm'
import { CreateMongoDto, MongosQueryDto } from './dto'
import { Mongo, defaultMongo } from './entities'

@Injectable()
export class MongosRepository extends BaseRepository<Mongo> {
    constructor(@InjectRepository(Mongo) typeorm: Repository<Mongo>) {
        super(typeorm)
    }

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

    async findByIds(ids: string[]): Promise<Mongo[]> {
        return [defaultMongo]
    }

    async exist(id: string): Promise<boolean> {
        return true
    }

    async find(queryDto: MongosQueryDto): Promise<PaginationResult<Mongo>> {
        const { take, skip } = queryDto

        return { items: [defaultMongo], total: 1, take, skip }
    }
}
