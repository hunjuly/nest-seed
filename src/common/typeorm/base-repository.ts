import { Assert, PaginationOptions, updateIntersection } from 'common'
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm'
import { AggregateRoot } from '.'
import { EntityNotFoundTypeormException } from './exceptions'

export abstract class BaseRepository<Entity extends AggregateRoot> {
    constructor(protected repo: Repository<Entity>) {}

    async create(entityData: DeepPartial<Entity>): Promise<Entity> {
        Assert.undefined(entityData.id, `id${entityData.id}가 정의되어 있으면 안 된다.`)

        const savedEntity = this.repo.save(entityData)

        return savedEntity
    }

    async update(id: string, partial: Partial<Entity>): Promise<Entity> {
        const entity = await this.repo.findOne({
            where: { id } as unknown as FindOptionsWhere<Entity>
        })

        if (entity) {
            const updatePsql = updateIntersection(entity, partial)

            const saved = await this.repo.save(updatePsql)

            Assert.deepEquals(saved, updatePsql, 'update 요청과 결과가 다름')

            return saved
        }

        throw new EntityNotFoundTypeormException(`Failed to update entity with id: ${id}. Entity not found.`)
    }

    async remove(id: string): Promise<void> {
        const result = await this.repo.delete(id)

        if (result.affected === 0) {
            throw new EntityNotFoundTypeormException(
                `Failed to remove entity with id: ${id}. Entity not found.`
            )
        }

        Assert.defined(result.affected, "DeleteResult doesn't have affected")
        Assert.truthy(result.affected === 1, 'Affected must be 1')
    }

    async findById(id: string): Promise<Entity | null> {
        return this.repo.findOne({
            where: { id } as unknown as FindOptionsWhere<Entity>
        })
    }

    async findByIds(ids: string[]): Promise<Entity[]> {
        return this.repo.findBy({
            id: In(ids)
        } as unknown as FindOptionsWhere<Entity>)
    }

    async exist(id: string): Promise<boolean> {
        return this.repo.exist({
            where: { id } as unknown as FindOptionsWhere<Entity>
        })
    }

    protected createQueryBuilder(opts: PaginationOptions = {}) {
        const { take, skip, orderby } = opts

        const qb = this.repo.createQueryBuilder('entity')

        take && qb.take(take)
        skip && qb.skip(skip)

        if (orderby) {
            const order = orderby.direction.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

            qb.orderBy(`entity.${orderby.name}`, order)
        }

        return qb
    }
}
