import { Module } from '@nestjs/common'
import { CacheModule } from './cache.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'
import { MongoDbModule } from './mongo.db.module'
import { PsqlDbModule } from './psql.db.module'
import { EventEmitterModule } from '@nestjs/event-emitter'

@Module({
    imports: [
        EventEmitterModule.forRoot({
            // set this to `true` to use wildcards
            wildcard: false,
            // the delimiter used to segment namespaces
            delimiter: '.',
            // set this to `true` if you want to emit the newListener event
            newListener: false,
            // set this to `true` if you want to emit the removeListener event
            removeListener: false,
            // the maximum amount of listeners that can be assigned to an event
            maxListeners: 10,
            // show event name in memory leak message when more than maximum amount of listeners is assigned
            verboseMemoryLeak: false,
            // disable throwing uncaughtException if an error event is emitted and it has no listeners
            ignoreErrors: false
        }),
        CacheModule,
        HttpModule,
        LoggerModule,
        MongoDbModule,
        PsqlDbModule
    ]
})
export class GlobalModule {}
