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

    async findByQuery(psqlQueryDto: PsqlsQueryDto): Promise<PaginationResult<Psql>> {
        const { take, skip, orderby, ...args } = psqlQueryDto

        const result = await this.find({
            take,
            skip,
            orderby,
            middleware: (qb) => {
                args.name && qb.andWhere('entity.name LIKE :name', { name: `%${args.name}%` })

                Object.entries(args).forEach(([key, value]) => {
                    if (key === 'name') return

                    if (value !== undefined) {
                        qb.andWhere(`entity.${key} = :${key}`, { [key]: value })
                    }
                })
            }
        })

        return result
    }
}
