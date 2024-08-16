import { Controller, Get, Injectable, Module } from '@nestjs/common'

@Injectable()
export class FixtureService {
    constructor() {}

    async getMessage() {
        throw new Error('This method should be mocked.')
    }
}

@Controller()
class FixtureController {
    constructor(private service: FixtureService) {}

    @Get()
    async getMessage() {
        return this.service.getMessage()
    }
}

@Module({
    controllers: [FixtureController],
    providers: [FixtureService]
})
export class FixtureModule {}
