import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TicketsModule } from '../tickets'
import { PaymentsController } from './payments.controller'
import { PaymentsRepository } from './payments.repository'
import { PaymentsService } from './payments.service'
import { Payment, PaymentSchema } from './schemas'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
        TicketsModule
    ],
    providers: [PaymentsService, PaymentsRepository],
    exports: [PaymentsService],
    controllers: [PaymentsController]
})
export class PaymentsModule {}
