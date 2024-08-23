import { BadRequestException, Controller, Get, Inject, Module } from '@nestjs/common'
import { ClientProxy, MessagePattern } from '@nestjs/microservices'

@Controller()
class MicroserviceController {
    @MessagePattern({ cmd: 'throwHttpException' })
    async throwHttpException() {
        throw new BadRequestException('not found exception')
    }
}

@Module({ controllers: [MicroserviceController] })
export class MicroserviceModule {}

@Controller('/')
export class HttpController {
    constructor(@Inject('SERVICES') private client: ClientProxy) {}

    @Get()
    async throwHttpException() {
        return this.client.send({ cmd: 'throwHttpException' }, {})
    }
}
