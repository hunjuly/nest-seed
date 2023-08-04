import { Module } from '@nestjs/common'
import { GlobalModule } from 'src/global'
import { SeedsModule } from './_seeds'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { addItemInDevelopment } from './common'
import { UsersModule } from './users/users.module'

@Module({
    imports: addItemInDevelopment([GlobalModule, UsersModule, AuthModule], [SeedsModule]),
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
