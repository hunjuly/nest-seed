import { HttpStatus } from '@nestjs/common'
import * as http from 'http'

interface RequestContext {
    url: string
    headers?: any
    body?: any
    query?: any
    status?: HttpStatus
}

export class HttpRequest {
    constructor(private readonly server: any) {}

    sendRequest(ctx: RequestContext, method: 'POST'): Promise<any> {
        return new Promise((resolve, reject) => {
            const serverUrl = `http://localhost:${this.server.address().port}` + ctx.url

            const body = JSON.stringify(ctx.body)

            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            }

            const req = http.request(serverUrl, options, (response) => {
                let responseData = ''

                response.on('data', (chunk) => {
                    responseData += chunk
                })

                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage,
                        body: JSON.parse(responseData)
                    })
                })
            })

            req.on('error', (error) => {
                console.log('error', error)
                reject(error)
            })

            req.write(body)
            req.end()
        })
    }

    async post(ctx: RequestContext) {
        return this.sendRequest(ctx, 'POST')
    }
}
