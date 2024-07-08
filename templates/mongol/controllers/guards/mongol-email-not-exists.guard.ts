import { CanActivate, ExecutionContext, Injectable, ConflictException } from '@nestjs/common'
import { MongolsService } from 'app/services/mongols'

@Injectable()
export class MongolEmailNotExistsGuard implements CanActivate {
    constructor(private readonly mongolsService: MongolsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const email = request.body.email

        if (email) {
            const mongol = await this.mongolsService.findByEmail(email)

            if (mongol) {
                throw new ConflictException(`Mongol with email ${email} already exists`)
            }
        }

        return true
    }
}
