import { TypeOrmModule } from '@nestjs/typeorm'
import { ValueTransformer } from 'typeorm'

export function createMemoryTypeormModule() {
    return TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        autoLoadEntities: true
    })
}

/**
 * sqlite에서는 열거형을 지원하지 않아서 변환해야 한다.
 *  @Column({ type: 'varchar', transformer: enumsTransformer<SeedEnum>() })
 * enums: SeedEnum[]
 */
export const enumsTransformer = <T>(): ValueTransformer => {
    return {
        to: (value: T[] | null): string | null => {
            if (value == null) {
                return null
            }
            return value.join(',')
        },
        from: (value: string | null): T[] | null => {
            if (value == null) {
                return null
            }
            return value.split(',') as T[]
        }
    }
}
