import { Assert, PaginationOptions, PaginationResult, updateIntersection } from 'common'
import { DeepPartial, FindOptionsWhere, In, Repository, SelectQueryBuilder } from 'typeorm'
import { TypeormEntity } from '.'
import { EntityNotFoundTypeormException, ParameterTypeormException } from './exceptions'

export abstract class TypeormRepository<Entity extends TypeormEntity> {
    constructor(protected repo: Repository<Entity>) {}

    async create(creationData: DeepPartial<Entity>): Promise<Entity> {
        Assert.undefined(creationData.id, `id${creationData.id}가 정의되어 있으면 안 된다.`)

        // repo.save(creationData)를 하면 creationData에 id가 자동으로 생성돼서 변형된다.
        const cloned = { ...creationData }
        const savedEntity = await this.repo.save(cloned)

        return savedEntity
    }

    async update(id: string, query: Partial<Entity>): Promise<Entity> {
        const entity = await this.repo.findOne({
            where: { id } as unknown as FindOptionsWhere<Entity>
        })

        if (entity) {
            const updatePsql = updateIntersection(entity, query)

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

    async find(
        option: {
            middleware?: (qb: SelectQueryBuilder<Entity>) => void
        } & PaginationOptions
    ): Promise<PaginationResult<Entity>> {
        const { take, skip, orderby, middleware } = option

        if (!take && !middleware) {
            throw new ParameterTypeormException(
                'At least one of the following options is required: [take, middleware].'
            )
        }

        const qb = this.repo.createQueryBuilder('entity')

        take && qb.take(take)
        skip && qb.skip(skip)

        if (orderby) {
            const order = orderby.direction.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

            qb.orderBy(`entity.${orderby.name}`, order)
        }

        middleware?.(qb)

        const [items, total] = await qb.getManyAndCount()

        return {
            skip: qb.expressionMap.skip,
            take: qb.expressionMap.take,
            total,
            items
        }
    }

    async exist(id: string): Promise<boolean> {
        return this.repo.exist({
            where: { id } as unknown as FindOptionsWhere<Entity>
        })
    }
}
