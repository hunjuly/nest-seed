import { CanActivate, ExecutionContext, ModuleMetadata } from '@nestjs/common'
import { Test } from '@nestjs/testing'

export interface ModuleMetadataEx extends ModuleMetadata {
    bypassGuards?: any[]
}

class NullGuard implements CanActivate {
    canActivate(_context: ExecutionContext) {
        return true
    }
}

export async function createTestingModule(metadata: ModuleMetadataEx) {
    const { bypassGuards, ...moduleConfig } = metadata
    const builder = Test.createTestingModule(moduleConfig)

    if (bypassGuards) {
        for (const guard of bypassGuards) {
            builder.overrideGuard(guard).useClass(NullGuard)
        }
    }

    const module = await builder.compile()

    return module
}
