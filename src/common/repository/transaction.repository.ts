import { QueryRunner } from 'typeorm'
import { Assert } from '../assert'
import { TransactionException } from '../exceptions'
import { AggregateRoot } from './aggregate-root'

export class TransactionRepository {
    rollbackRequested: boolean

    constructor(private queryRunner: QueryRunner) {
        this.rollbackRequested = false
    }

    rollback() {
        this.rollbackRequested = true
    }

    async create<T extends AggregateRoot>(entity: T): Promise<T> {
        Assert.falsy(this.rollbackRequested, 'rollback() 호출 이후에 실행')
        Assert.undefined(entity.id, `EntityData already has an id${entity.id}`)

        return this.save(entity)
    }

    async update<T extends AggregateRoot>(entity: T): Promise<T> {
        Assert.falsy(this.rollbackRequested, 'rollback() 호출 이후에 실행')
        Assert.defined(entity.id, "Entity doesn't have id")

        return this.save(entity)
    }

    private async save<T extends AggregateRoot>(entity: T): Promise<T> {
        Assert.falsy(this.rollbackRequested, 'rollback() 호출 이후에 실행')

        /* istanbul ignore next */
        if (!this.queryRunner.isTransactionActive) {
            throw new TransactionException('Transaction is not active')
        }

        Assert.truthy(entity instanceof AggregateRoot, 'Invalid entity type')

        return this.queryRunner.manager.save(entity)
    }

    async remove<T extends AggregateRoot>(entity: T): Promise<void> {
        Assert.falsy(this.rollbackRequested, 'rollback() 호출 이후에 실행')

        /* istanbul ignore next */
        if (!this.queryRunner.isTransactionActive) {
            throw new TransactionException('Transaction is not active')
        }

        await this.queryRunner.manager.remove(entity)
    }
}
