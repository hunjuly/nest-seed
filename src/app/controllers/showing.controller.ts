import { Controller, Get, NotFoundException, Query, UsePipes } from '@nestjs/common'
import { CustomersService } from 'app/services/customers'
import { ShowingService } from 'app/services/showing'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('showing')
export class ShowingController {
    constructor(
        private showingService: ShowingService,
        private customersService: CustomersService
    ) {}

    @Get('/movies/recommended')
    @UsePipes(new PaginationPipe(50))
    async findPagedShowtimes(@Query('customerId') customerId: string, @Query() pagination: PaginationOption) {
        const customerExists = await this.customersService.customerExists(customerId)

        if (!customerExists) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`)
        }

        this.showingService.getRecommendedMovies(customerId)
    }
}
