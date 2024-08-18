import { HttpStatus } from '@nestjs/common'
import {
    ClientOptions,
    ClientProxy,
    ClientProxyFactory
} from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'
import { jsonToObject } from '../utils'

export class MicroserviceClient {
    static async create(option: ClientOptions) {
        const client = ClientProxyFactory.create(option)
        await client.connect()

        return new MicroserviceClient(client)
    }

    constructor(private client: ClientProxy) {}

    async close() {
        await this.client.close()
    }

    async send(cmd: string, payload: any) {
        return jsonToObject(await lastValueFrom(this.client.send({ cmd }, payload)))
    }

    async error(cmd: string, payload: any, status: HttpStatus) {
        const res = lastValueFrom(this.client.send({ cmd }, payload))
        await expect(res).rejects.toMatchObject({ status, message: expect.any(String) })
    }
}
