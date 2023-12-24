import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationResult, TypeormRepository } from 'common'
import { Repository } from 'typeorm'
import { PsqlsQueryDto } from './dto'
import { Psql } from './entities'

@Injectable()
export class PsqlsRepository extends TypeormRepository<Psql> {
    constructor(@InjectRepository(Psql) repo: Repository<Psql>) {
        super(repo)
    }

    async findByQuery(queryDto: PsqlsQueryDto): Promise<PaginationResult<Psql>> {
        const { take, skip, orderby, ...filters } = queryDto

        const result = await this.find({
            take,
            skip,
            orderby,
            middleware: (qb) => {
                const { name } = filters

                name && qb.where('entity.name LIKE :name', { name: `%${name}%` })
            }
        })

        return result
    }
}
