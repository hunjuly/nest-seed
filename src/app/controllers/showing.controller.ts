import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { CustomersService } from 'app/services/customers'
import { ShowingService } from 'app/services/showing'
import { CustomerExistsGuard } from './guards'

@Controller('showing')
export class ShowingController {
    constructor(
        private showingService: ShowingService,
        private customersService: CustomersService
    ) {}

    @Get('/movies/recommended')
    @UseGuards(CustomerExistsGuard)
    async getRecommendedMovies(@Query('customerId') customerId: string) {
        return this.showingService.getRecommendedMovies(customerId)
    }
}
