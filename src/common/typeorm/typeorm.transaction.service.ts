import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { TypeormTransactionRepository } from '.'

@Injectable()
export class TransactionService {
    constructor(private dataSource: DataSource) {}

    async execute<Entity>(
        task: (transactionRepository: TypeormTransactionRepository) => Promise<Entity>
    ): Promise<Entity> {
        const queryRunner = this.dataSource.createQueryRunner()

        try {
            await queryRunner.connect()
            await queryRunner.startTransaction()

            const transactionRepository = new TypeormTransactionRepository(queryRunner)

            const result = await task(transactionRepository)

            if (transactionRepository.isRollbackRequested()) {
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
