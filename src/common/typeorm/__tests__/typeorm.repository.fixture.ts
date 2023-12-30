import { padNumber } from 'common'
import { Sample, SamplesRepository } from './typeorm.repository.mock'

export const sampleCreationData: Partial<Sample> = {
    name: 'sample name'
}

export function sortSamples(samples: Sample[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...samples].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...samples].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createSample(repository: SamplesRepository): Promise<Sample> {
    const sample = await repository.create(sampleCreationData)

    return sample
}

export async function createManySamples(repository: SamplesRepository): Promise<Sample[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        const data = { ...sampleCreationData, name: `Sample_${padNumber(i, 3)}` }
        createPromises.push(repository.create(data))
    }

    const samples = await Promise.all(createPromises)

    return sortSamples(samples)
}

expect.extend({
    toValidEntity(received, expected) {
        const pass = this.equals(received, {
            id: expect.anything(),
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            version: expect.anything(),
            ...expected
        })

        const message = pass ? () => `expected entity not to match` : () => `expected entity to match`

        return { pass, message }
    }
})

declare module 'expect' {
    interface Matchers<R> {
        toValidEntity(expected: Partial<Sample>): R
    }
}
