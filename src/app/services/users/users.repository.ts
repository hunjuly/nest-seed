import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationOption, PaginationResult, TypeormRepository } from 'common'
import { Repository } from 'typeorm'
import { UsersFilterDto } from './dto'
import { User } from './entities'

@Injectable()
export class UsersRepository extends TypeormRepository<User> {
    constructor(@InjectRepository(User) typeorm: Repository<User>) {
        super(typeorm)
    }

    async findPagedUsers(
        filterDto: UsersFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<User>> {
        const result = await this.findWithPagination(pagination, (qb) => {
            Object.entries(filterDto).forEach(([key, value]) => {
                if (value !== undefined) {
                    qb.andWhere(`entity.${key} = :${key}`, { [key]: value })
                }
            })
        })

        return result
    }

    async findByEmail(email: string): Promise<User | null> {
        const users = await this.findByFilter({ email })

        return users.length === 1 ? users[0] : null
    }
}
