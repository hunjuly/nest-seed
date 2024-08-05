import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CoreModule } from 'core'
import { CUSTOMERS_SERVICE } from './constants'
import { CustomersController } from './controllers'
import { CustomerJwtStrategy, CustomerLocalStrategy } from './strategies'

@Module({
    imports: [
        ClientsModule.register([
            {
                name: CUSTOMERS_SERVICE,
                transport: Transport.TCP,
                options: { host: '0.0.0.0', port: 3000 }
            }
        ]),
        CoreModule
        // MoviesModule,
        // TheatersModule,
        // TicketsModule,
        // ShowtimesModule
    ],
    providers: [CustomerLocalStrategy, CustomerJwtStrategy],
    controllers: [
        CustomersController
        // MoviesController,
        // TheatersController,
        // TicketsController,
        // ShowtimesController
    ]
})
export class AppModule {}
