import { Injectable, Logger } from '@nestjs/common'
import { DataSource, QueryRunner } from 'typeorm'
import { LogicException, TransactionException } from '../exceptions'
import { AggregateRoot } from './aggregate-root'

/**
 * Scope.REQUEST
 * Scope.TRANSIENT
 * 각각의 방법으로 구현하고 문제점을 알아보자.
 */
@Injectable()
export class TransactionService {
    constructor(private dataSource: DataSource) {}

    async execute<T>(operation: (repository: TransactionRepository) => Promise<T>): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner()

        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()

            const repository = new TransactionRepository(queryRunner)

            const result = await operation(repository)

            if (repository.isRollbacked) {
                await queryRunner.rollbackTransaction()
            } else {
                await queryRunner.commitTransaction()
            }

            return result
        } catch (error) {
            /* istanbul ignore next */
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction()
            }

            /* istanbul ignore next */
            throw error
        } finally {
            /* istanbul ignore if */
            if (queryRunner.isReleased) {
                Logger.warn('QueryRunner is already released')
            } else {
                await queryRunner.release()
            }
        }
    }
}

export class TransactionRepository {
    // wantsRollback?
    isRollbacked: boolean

    constructor(private queryRunner: QueryRunner) {
        this.isRollbacked = false
    }

    rollback() {
        this.isRollbacked = true
    }

    async create<T extends AggregateRoot>(entity: T): Promise<T> {
        if (entity.id) {
            throw new LogicException('EntityData already has an id')
        }

        return this.save(entity)
    }

    async update<T extends AggregateRoot>(entity: T): Promise<T> {
        if (!entity.id) {
            throw new LogicException("Entity doesn't have id")
        }

        return this.save(entity)
    }

    private async save<T extends AggregateRoot>(entity: T): Promise<T> {
        /* istanbul ignore next */
        if (!this.queryRunner.isTransactionActive) {
            throw new TransactionException('Transaction is not active')
        }

        if (!(entity instanceof AggregateRoot)) {
            throw new LogicException('Invalid entity type')
        }

        return this.queryRunner.manager.save(entity)
    }

    async remove<T extends AggregateRoot>(entity: T): Promise<void> {
        /* istanbul ignore next */
        if (!this.queryRunner.isTransactionActive) {
            throw new TransactionException('Transaction is not active')
        }

        await this.queryRunner.manager.remove(entity)
    }
}
