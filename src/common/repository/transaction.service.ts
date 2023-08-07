import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { TransactionRepository } from './transaction.repository'

@Injectable()
export class TransactionService {
    constructor(private dataSource: DataSource) {}

    async execute<T>(
        operation: (repository: TransactionRepository) => Promise<T>,
        transactionRepository?: TransactionRepository
    ): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner()

        try {
            let repository: TransactionRepository

            if (transactionRepository) {
                repository = transactionRepository
            } else {
                await queryRunner.connect()
                await queryRunner.startTransaction()

                repository = new TransactionRepository(queryRunner)
            }

            const result = await operation(repository)

            if (repository.rollbackRequested) {
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
