import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TypeormRepository, PaginationResult } from 'common'
import { Repository } from 'typeorm'
import { PsqlsQueryDto } from './dto'
import { Psql } from './entities'

@Injectable()
export class PsqlsRepository extends TypeormRepository<Psql> {
    constructor(@InjectRepository(Psql) repo: Repository<Psql>) {
        super(repo)
    }

    async findByName(queryDto: PsqlsQueryDto): Promise<PaginationResult<Psql>> {
        const result = await super.find({
            page: queryDto,
            middleware: (qb) => {
                if (queryDto.name) {
                    qb.where('entity.name LIKE :name', {
                        name: `%${queryDto.name}%`
                    })
                }
            }
        })

        return result
    }
}
