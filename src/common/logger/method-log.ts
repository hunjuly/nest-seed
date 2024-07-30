import { Logger, LogLevel } from '@nestjs/common'
import 'reflect-metadata'

export function MethodLog(level: LogLevel = 'log') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value
        const className = target.constructor.name
        const logger = new Logger(className)

        descriptor.value = async function (...args: any[]) {
            const start = Date.now()
            try {
                const result = await originalMethod.apply(this, args)
                logger[level](`${className}.${propertyKey} completed`, {
                    args: JSON.stringify(args),
                    return: JSON.stringify(result),
                    duration: Date.now() - start
                })
                return result
            } catch (error) {
                logger.error(`${className}.${propertyKey} failed`, {
                    args: JSON.stringify(args),
                    error: error.message,
                    duration: Date.now() - start
                })
                throw error
            }
        }
    }
}
