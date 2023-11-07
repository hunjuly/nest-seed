import { Module } from '@nestjs/common'
import { MongosService } from './mongos.service'

import { GlobalModule } from 'app/global'
import { MongosRepository } from './mongos.repository'

@Module({
    imports: [GlobalModule],
    providers: [MongosService, MongosRepository],
    exports: [MongosService]
})
export class MongosModule {}
