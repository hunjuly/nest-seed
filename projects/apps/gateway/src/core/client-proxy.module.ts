import { Global, Inject, Injectable, Module, OnModuleDestroy } from '@nestjs/common'
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices'
import { jsonToObject } from 'common'
import { Config } from 'config'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class ClientProxyService implements OnModuleDestroy {
    constructor(@Inject('SERVICES') private client: ClientProxy) {}
    async onModuleDestroy() {
        await this.client.close()
    }

    send(cmd: string, payload: any) {
        return this.client.send({ cmd }, payload)
    }

    async get(cmd: string, payload: any) {
        return jsonToObject(await lastValueFrom(this.client.send({ cmd }, payload)))
    }
}

@Global()
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'SERVICES',
                useFactory: () => ({
                    transport: Transport.TCP,
                    options: {
                        host: '0.0.0.0',
                        port: Config.service.port
                    }
                })
            }
        ])
    ],
    providers: [ClientProxyService],
    exports: [ClientProxyService]
})
export class ClientProxyModule {}
