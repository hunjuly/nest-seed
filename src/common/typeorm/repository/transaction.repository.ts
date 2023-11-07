import { QueryRunner } from 'typeorm'
import { Assert } from '../../assert'
import { TransactionException } from '../../exceptions'
import { AggregateRoot } from './aggregate-root'

export class TransactionRepository {
    private rollbackRequested: boolean

    constructor(private queryRunner: QueryRunner) {
        this.rollbackRequested = false
    }

    rollback() {
        this.rollbackRequested = true
    }

    isRollbackRequested() {
        return this.rollbackRequested
    }

    async create<T extends AggregateRoot>(entity: T): Promise<T> {
        Assert.falsy(this.rollbackRequested, 'rollback()을 실행한 상태임')
        Assert.undefined(entity.id, `EntityData already has an id${entity.id}`)

        return this.save(entity)
    }

    async update<T extends AggregateRoot>(entity: T): Promise<T> {
        Assert.falsy(this.rollbackRequested, 'rollback()을 실행한 상태임')
        Assert.defined(entity.id, "Entity doesn't have id")

        return this.save(entity)
    }

    private async save<T extends AggregateRoot>(entity: T): Promise<T> {
        Assert.falsy(this.rollbackRequested, 'rollback()을 실행한 상태임')
        this.ensureTransactionIsActive()

        Assert.truthy(entity instanceof AggregateRoot, 'Invalid entity type')

        return this.queryRunner.manager.save(entity)
    }

    async remove<T extends AggregateRoot>(entity: T): Promise<void> {
        Assert.falsy(this.rollbackRequested, 'rollback()을 실행한 상태임')
        this.ensureTransactionIsActive()

        await this.queryRunner.manager.remove(entity)
    }

    ensureTransactionIsActive() {
        /* istanbul ignore if */
        if (!this.queryRunner.isTransactionActive) {
            throw new TransactionException('Transaction is not active')
        }
    }
}
