import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationResult, TypeormRepository } from 'common'
import { Repository } from 'typeorm'
import { UsersQueryDto } from './dto'
import { User } from './entities'

@Injectable()
export class UsersRepository extends TypeormRepository<User> {
    constructor(@InjectRepository(User) typeorm: Repository<User>) {
        super(typeorm)
    }

    async findByQuery(queryDto: UsersQueryDto): Promise<PaginationResult<User>> {
        const { take, skip, orderby, ...args } = queryDto

        const result = await this.find({
            take,
            skip,
            orderby,
            middleware: (qb) => {
                Object.entries(args).forEach(([key, value]) => {
                    if (value !== undefined) {
                        qb.andWhere(`entity.${key} = :${key}`, { [key]: value })
                    }
                })
            }
        })

        return result
    }
}
