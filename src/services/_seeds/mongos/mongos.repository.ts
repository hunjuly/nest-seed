import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { BaseRepository, PaginationResult } from 'src/common'
import { Repository } from 'typeorm'
import { MongosQueryDto } from './dto'
import { Mongo } from './entities'

@Injectable()
export class MongosRepository extends BaseRepository<Mongo> {
    constructor(@InjectRepository(Mongo) typeorm: Repository<Mongo>) {
        super(typeorm)
    }

    async find(queryDto: MongosQueryDto): Promise<PaginationResult<Mongo>> {
        const { take, skip } = queryDto

        const qb = this.createQueryBuilder(queryDto)

        if (queryDto.name) {
            qb.where('entity.name LIKE :name', {
                name: `%${queryDto.name}%`
            })
        }

        const [items, total] = await qb.getManyAndCount()

        return { items, total, take, skip }
    }
}
