import { Module } from '@nestjs/common'
import { CoreModule } from './core'
import { CustomerJwtStrategy, CustomerLocalStrategy } from './strategies'
import {
    CustomersController,
    MoviesController,
    TheatersController,
    TicketsController,
    ShowtimesController,
    PaymentsController,
    ShowingController,
    StorageFilesController
} from './controllers'

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
