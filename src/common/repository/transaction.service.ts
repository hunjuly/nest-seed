import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { TransactionRepository } from './transaction.repository'

@Injectable()
export class TransactionService {
    constructor(private dataSource: DataSource) {}

    async execute<T>(
        task: (transactionRepository: TransactionRepository) => Promise<T>,
        providedRepository?: TransactionRepository
    ): Promise<T> {
        let result: T

        if (providedRepository) {
            result = await task(providedRepository)
        } else {
            result = await this.startAndExecute(task)
        }

        return result
    }

    private async startAndExecute<T>(
        task: (transactionRepository: TransactionRepository) => Promise<T>
    ): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner()

        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()

            const transactionRepository = new TransactionRepository(queryRunner)

            const result = await task(transactionRepository)

            if (transactionRepository.rollbackRequested) {
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
