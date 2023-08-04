import { Module } from '@nestjs/common'
import { GlobalModule } from 'src/global'
import { SeedsModule } from './_seeds'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { isDevelopment } from './common'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'

@Module({
    imports: [GlobalModule, UsersModule, AuthModule, ...(isDevelopment() ? [SeedsModule] : [])],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
