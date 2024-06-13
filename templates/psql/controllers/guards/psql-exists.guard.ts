import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { PsqlsService } from 'app/services/psqls'

@Injectable()
export class PsqlExistsGuard implements CanActivate {
    constructor(private readonly psqlsService: PsqlsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const psqlId = request.query.psqlId || request.params.psqlId

        const psqlExists = await this.psqlsService.doesPsqlExist(psqlId)

        if (!psqlExists) {
            throw new NotFoundException(`Psql with ID ${psqlId} not found`)
        }

        return true
    }
}
