import { Controller, Get, Module } from '@nestjs/common'
import { LatLong } from '../../types'
import { LatLongQuery } from '../pipes'

@Controller('')
class TestController {
    @Get('latlong')
    async testLatlong(@LatLongQuery() latlong: LatLong) {
        return latlong
    }

    @Get('custom-key')
    async testCustom(@LatLongQuery('customKey') latlong: LatLong) {
        return latlong
    }
}

@Module({
    controllers: [TestController]
})
export class TestModule {}
