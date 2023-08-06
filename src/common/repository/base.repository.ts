import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm'
import { Assert } from '../assert'
import { PaginationOptions } from '../pagination'
import { AggregateRoot } from './aggregate-root'

export abstract class BaseRepository<T extends AggregateRoot> {
    constructor(protected typeorm: Repository<T>) {}

    createCandidate(entityData: DeepPartial<T>): T {
        Assert.undefined(entityData.id, `EntityData already has an id${entityData.id}`)

        const createdEntity = this.typeorm.create(entityData)

        return createdEntity
    }

    async create(entityData: DeepPartial<T>): Promise<T> {
        const createdEntity = this.createCandidate(entityData)
        const savedEntity = this.typeorm.save(createdEntity)

        return savedEntity
    }

    async update(entity: T): Promise<T> {
        Assert.defined(entity.id, "Entity doesn't have id")

        return this.typeorm.save(entity)
    }

    async remove(entity: T): Promise<void> {
        await this.typeorm.remove(entity)
    }

    async findById(id: string): Promise<T | null> {
        return this.typeorm.findOne({
            where: { id } as FindOptionsWhere<T>
        })
    }

    async findByIds(ids: string[]): Promise<T[]> {
        return this.typeorm.findBy({
            id: In(ids)
        } as FindOptionsWhere<T>)
    }

    async exist(id: string): Promise<boolean> {
        return this.typeorm.exist({
            where: { id } as FindOptionsWhere<T>
        })
    }

    createQueryBuilder(opts: PaginationOptions = {}) {
        const { take, skip, orderby } = opts

        const qb = this.typeorm.createQueryBuilder('entity')

        take && qb.take(take)
        skip && qb.skip(skip)

        if (orderby) {
            const order = orderby.direction.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

            qb.orderBy(`entity.${orderby.name}`, order)
        }

        return qb
    }
}
