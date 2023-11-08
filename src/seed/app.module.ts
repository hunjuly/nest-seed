import { Module } from '@nestjs/common'
import { PsqlsController } from './controllers'
import { MongosModule, PsqlsModule } from './services'
import { MongoDbModule, PsqlDbModule } from './modules'

@Module({
    imports: [MongoDbModule, MongosModule, PsqlDbModule, PsqlsModule],
    controllers: [PsqlsController]
})
export class AppModule {}
