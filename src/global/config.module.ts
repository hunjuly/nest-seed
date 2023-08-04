import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { SafeConfigService, envFilename } from 'src/common'

@Global()
@Module({
    imports: [
        NestConfigModule.forRoot({
            envFilePath: [envFilename()],
            isGlobal: true,
            cache: true
        })
    ],
    providers: [SafeConfigService],
    exports: [SafeConfigService]
})
export class ConfigModule {}
