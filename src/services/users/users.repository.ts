import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { BaseRepository, PaginationResult } from 'src/common'
import { FindOptionsWhere, Repository } from 'typeorm'
import { UsersQueryDto } from './dto'
import { User } from './entities'

@Injectable()
export class UsersRepository extends BaseRepository<User> {
    constructor(@InjectRepository(User) typeorm: Repository<User>) {
        super(typeorm)
    }

    async find(queryDto: UsersQueryDto): Promise<PaginationResult<User>> {
        const { take, skip } = queryDto

        const qb = this.createQueryBuilder(queryDto)

        if (queryDto.email) {
            qb.where('entity.email LIKE :email', {
                email: `%${queryDto.email}%`
            })
        }

        const [items, total] = await qb.getManyAndCount()

        return { items, total, take, skip }
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.typeorm.findOneBy({ email })
    }

    async emailExists(email: string): Promise<boolean> {
        return this.typeorm.exist({
            where: { email } as FindOptionsWhere<User>
        })
    }
}