import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Seed } from './entities'
import { SeedsRepository } from './seeds.repository'
import { SeedsService } from './seeds.service'

@Module({
    imports: [TypeOrmModule.forFeature([Seed])],
    providers: [SeedsService, SeedsRepository],
    exports: [SeedsService]
})
export class SeedsModule {}
