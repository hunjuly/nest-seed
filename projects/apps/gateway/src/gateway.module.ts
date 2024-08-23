import { Module } from '@nestjs/common'
import { CoreModule } from './core'
import { CustomersController } from './customers.controller'
import { MoviesController } from './movies.controller'
import { PaymentsController } from './payments.controller'
import { ShowingController } from './showing.controller'
import { ShowtimesController } from './showtimes.controller'
import { StorageFilesController } from './storage-files.controller'
import { CustomerJwtStrategy, CustomerLocalStrategy } from './strategies'
import { TheatersController } from './theaters.controller'
import { TicketsController } from './tickets.controller'

@Module({
    imports: [CoreModule],
    providers: [CustomerLocalStrategy, CustomerJwtStrategy],
    controllers: [
        CustomersController,
        MoviesController,
        TheatersController,
        TicketsController,
        ShowtimesController,
        PaymentsController,
        ShowingController,
        StorageFilesController
    ]
})
export class GatewayModule {}
