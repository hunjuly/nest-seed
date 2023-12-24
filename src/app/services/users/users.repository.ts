import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationResult, TypeormRepository } from 'common'
import { FindOptionsWhere, Repository } from 'typeorm'
import { UsersQueryDto } from './dto'
import { User } from './entities'

@Injectable()
export class UsersRepository extends TypeormRepository<User> {
    constructor(@InjectRepository(User) typeorm: Repository<User>) {
        super(typeorm)
    }

    async findByQuery(queryDto: UsersQueryDto): Promise<PaginationResult<User>> {
        const { take, skip, orderby, ...filters } = queryDto

        const result = await this.find({
            take,
            skip,
            orderby,
            middleware: (qb) => {
                const { email } = filters

                email && qb.where('entity.email LIKE :email', { email: `%${email}%` })
            }
        })

        return result
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.repo.findOneBy({ email })
    }

    async emailExists(email: string): Promise<boolean> {
        return this.repo.exist({
            where: { email } as FindOptionsWhere<User>
        })
    }
}
