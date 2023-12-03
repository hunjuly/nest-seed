import { Assert } from 'common/assert'
import { PaginationOptions } from 'common/pagination'
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm'
import { AggregateRoot } from './typeorm.aggregate-root'

export abstract class BaseRepository<Entity extends AggregateRoot> {
    constructor(protected typeorm: Repository<Entity>) {}

    async create(entityData: DeepPartial<Entity>): Promise<Entity> {
        const savedEntity = this.typeorm.save(entityData)

        return savedEntity
    }

    async update(entity: Entity): Promise<Entity> {
        Assert.defined(entity.id, "Entity doesn't have id")

        return this.typeorm.save(entity)
    }

    async remove(entity: Entity): Promise<void> {
        await this.typeorm.remove(entity)
    }

    async findById(id: string): Promise<Entity | null> {
        return this.typeorm.findOne({
            where: { id } as FindOptionsWhere<Entity>
        })
    }

    async findByIds(ids: string[]): Promise<Entity[]> {
        return this.typeorm.findBy({
            id: In(ids)
        } as FindOptionsWhere<Entity>)
    }

    async exist(id: string): Promise<boolean> {
        return this.typeorm.exist({
            where: { id } as FindOptionsWhere<Entity>
        })
    }

    protected createQueryBuilder(opts: PaginationOptions = {}) {
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
