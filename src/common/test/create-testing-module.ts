import { CanActivate, ExecutionContext, Injectable, ModuleMetadata } from '@nestjs/common'
import { Test } from '@nestjs/testing'

interface OverrideItem {
    original: any
    replacement: any
}

export interface ModuleMetadataEx extends ModuleMetadata {
    ignoreGuards?: any[]
    ignoreProviders?: any[]
    overrideProviders?: OverrideItem[]
}

class NullGuard implements CanActivate {
    canActivate(_context: ExecutionContext) {
        return true
    }
}

@Injectable()
class NullProvider {}

export async function createTestingModule(metadata: ModuleMetadataEx) {
    const { ignoreGuards, ignoreProviders, overrideProviders, ...moduleConfig } = metadata
    const builder = Test.createTestingModule(moduleConfig)

    if (ignoreGuards) {
        for (const guard of ignoreGuards) {
            builder.overrideGuard(guard).useClass(NullGuard)
        }
    }

    if (ignoreProviders) {
        for (const provider of ignoreProviders) {
            builder.overrideProvider(provider).useClass(NullProvider)
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
