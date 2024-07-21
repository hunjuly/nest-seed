import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import { createTestingModule } from 'common/test'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { Connection } from 'mongoose'
import { SampleModule, SamplesRepository } from './mongoose.repository.fixture'

describe('(Not Completed)MongoDB Cluster Testing', () => {
    let mongoServer: MongoMemoryReplSet
    let module: TestingModule
    let repository: SamplesRepository

    beforeAll(async () => {
        mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 3 } })
    })

    afterAll(async () => {
        await mongoServer?.stop()
    })

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [
                MongooseModule.forRoot(mongoServer.getUri(), {
                    // readPreference: 'primary',
                    writeConcern: { w: 1, wtimeoutMS: 5000, journal: true },
                    connectionFactory: async (connection: Connection) => {
                        await connection.dropDatabase()
                        return connection
                    }
                }),
                SampleModule
            ]
        })
        repository = module.get(SamplesRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('stress', async () => {
        const length = 100

        const samples = await Promise.all(
            Array.from({ length }, async (_, index) => {
                const sample = await repository.create({ name: `create-${index}` })
                return repository.update(sample._id, { name: `update-${index}` })
            })
        )

        console.log(samples.length)
        expect(samples).toHaveLength(length)
    })
})
