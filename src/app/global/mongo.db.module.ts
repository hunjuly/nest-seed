import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { mongoDatasource } from 'databases/mongo'

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: () => mongoDatasource
        })
    ]
})
export class MongoDbModule {}
