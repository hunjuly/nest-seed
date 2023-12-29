import { padNumber } from 'common'
import { Sample, SamplesRepository } from './typeorm.repository.mock'

export const createSampleData: Partial<Sample> = {
    name: 'sample name'
}

export function sortSamples(samples: Sample[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...samples].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...samples].sort((a, b) => a.name.localeCompare(b.name))
}

export async function generateSampleData(repository: SamplesRepository): Promise<Sample[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        const data = { ...createSampleData, name: `Sample_${padNumber(i, 3)}` }
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
