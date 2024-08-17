import { Controller, Injectable, Module, NotFoundException } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'

@Injectable()
export class SampleService {
    constructor() {}

    async getMessage(arg: string) {
        throw new NotFoundException('not found exception')
    }
}

@Controller()
class SampleController {
    constructor(private service: SampleService) {}

    @MessagePattern({ cmd: 'getMessage' })
    async getMessage(arg: string) {
        return this.service.getMessage(arg)
    }
}

@Module({
    controllers: [SampleController],
    providers: [SampleService]
})
export class SampleModule {}
