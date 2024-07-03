import { Module } from '@nestjs/common'
import { Payment, PaymentSchema } from './schemas'
import { PaymentsRepository } from './payments.repository'
import { PaymentsService } from './payments.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }])],
    providers: [PaymentsService, PaymentsRepository],
    exports: [PaymentsService]
})
export class PaymentsModule {}
