import { Assert, PaginationOptions, updateIntersection } from 'common'
import { DeepPartial, FindOptionsWhere, In, Repository as TypeormRepository } from 'typeorm'
import { AggregateRoot } from '.'
import { EntityNotFoundException } from './typeorm.exceptions'

export abstract class Repository<Entity extends AggregateRoot> {
    constructor(protected typeorm: TypeormRepository<Entity>) {}

    async create(entityData: DeepPartial<Entity>): Promise<Entity> {
        const savedEntity = this.typeorm.save(entityData)

        return savedEntity
    }

    async update(id: string, partial: Partial<Entity>): Promise<Entity> {
        const entity = await this.typeorm.findOne({
            where: { id } as unknown as FindOptionsWhere<Entity>
        })

        if (entity) {
            const updatePsql = updateIntersection(entity, partial)

            const saved = await this.typeorm.save(updatePsql)

            Assert.deepEquals(saved, updatePsql, 'update 요청과 결과가 다름')

            return saved
        }

        throw new EntityNotFoundException(`Failed to remove entity with id: ${id}. Entity not found.`)
    }

    async remove(id: string): Promise<void> {
        const result = await this.typeorm.delete(id)

        if (result.affected === 0) {
            throw new EntityNotFoundException(`Failed to remove entity with id: ${id}. Entity not found.`)
        }

        Assert.defined(result.affected, "DeleteResult doesn't have affected")
        Assert.truthy(result.affected === 1, 'Affected must be 1')
    }

    async findById(id: string): Promise<Entity | null> {
        return this.typeorm.findOne({
            where: { id } as unknown as FindOptionsWhere<Entity>
        })
    }

    async findByIds(ids: string[]): Promise<Entity[]> {
        return this.typeorm.findBy({
            id: In(ids)
        } as unknown as FindOptionsWhere<Entity>)
    }

    async exist(id: string): Promise<boolean> {
        return this.typeorm.exist({
            where: { id } as unknown as FindOptionsWhere<Entity>
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
