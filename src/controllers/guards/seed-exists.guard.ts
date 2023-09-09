import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { SeedsService } from 'src/services'

@Injectable()
export class SeedExistsGuard implements CanActivate {
    constructor(private readonly seedsService: SeedsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const seedId = request.params.seedId

        const seedExists = await this.seedsService.seedExists(seedId)

        if (!seedExists) {
            throw new NotFoundException(`Seed with ID ${seedId} not found`)
        }

        return true
    }
}
