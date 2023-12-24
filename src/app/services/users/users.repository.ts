import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TypeormRepository, PaginationResult } from 'common'
import { FindOptionsWhere, Repository } from 'typeorm'
import { UsersQueryDto } from './dto'
import { User } from './entities'

@Injectable()
export class UsersRepository extends TypeormRepository<User> {
    constructor(@InjectRepository(User) typeorm: Repository<User>) {
        super(typeorm)
    }

    async findByQuery(queryDto: UsersQueryDto): Promise<PaginationResult<User>> {
        const result = await super.find({
            page: queryDto,
            middleware: (qb) => {
                if (queryDto.email) {
                    qb.where('entity.email LIKE :email', {
                        email: `%${queryDto.email}%`
                    })
                }
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
