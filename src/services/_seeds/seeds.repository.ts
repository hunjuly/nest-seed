import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { BaseRepository, PaginationResult } from 'src/common'
import { Repository } from 'typeorm'
import { SeedsQueryDto } from './dto'
import { Seed } from './entities'

@Injectable()
export class SeedsRepository extends BaseRepository<Seed> {
    constructor(@InjectRepository(Seed) typeorm: Repository<Seed>) {
        super(typeorm)
    }

    async find(queryDto: SeedsQueryDto): Promise<PaginationResult<Seed>> {
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
