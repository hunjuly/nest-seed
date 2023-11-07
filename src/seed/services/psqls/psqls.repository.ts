import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { BaseRepository, PaginationResult } from 'common'
import { Repository } from 'typeorm'
import { PsqlsQueryDto } from './dto'
import { Psql } from './entities'

@Injectable()
export class PsqlsRepository extends BaseRepository<Psql> {
    constructor(@InjectRepository(Psql) typeorm: Repository<Psql>) {
        super(typeorm)
    }

    async find(queryDto: PsqlsQueryDto): Promise<PaginationResult<Psql>> {
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
