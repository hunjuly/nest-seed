import { CanActivate, ExecutionContext, ModuleMetadata } from '@nestjs/common'
import { Test } from '@nestjs/testing'

interface OverrideItem {
    original: any
    replacement: any
}

export interface ModuleMetadataEx extends ModuleMetadata {
    ignoreGuards?: any[]
    overrideProviders?: OverrideItem[]
}

class NullGuard implements CanActivate {
    canActivate(_context: ExecutionContext) {
        return true
    }
}

export async function createTestingModule(metadata: ModuleMetadataEx) {
    const { ignoreGuards, overrideProviders, ...moduleConfig } = metadata
    const builder = Test.createTestingModule(moduleConfig)

    if (ignoreGuards) {
        for (const guard of ignoreGuards) {
            builder.overrideGuard(guard).useClass(NullGuard)
        }
    }

    if (overrideProviders) {
        for (const provider of overrideProviders) {
            builder.overrideProvider(provider.original).useValue(provider.replacement)
        }
    }

    const module = await builder.compile()

    return module
}
