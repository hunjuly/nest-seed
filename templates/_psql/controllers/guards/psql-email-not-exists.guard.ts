import { CanActivate, ExecutionContext, Injectable, ConflictException } from '@nestjs/common'
import { PsqlsService } from 'app/services/psqls'

@Injectable()
export class PsqlEmailNotExistsGuard implements CanActivate {
    constructor(private readonly psqlsService: PsqlsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const email = request.body.email

        if (email) {
            const psql = await this.psqlsService.findByEmail(email)

            if (psql) {
                throw new ConflictException(`Psql with email ${email} already exists`)
            }
        }

        return true
    }
}
