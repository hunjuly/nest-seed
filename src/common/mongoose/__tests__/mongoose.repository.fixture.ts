import { padNumber } from 'common'
import { Sample, SampleDocument, SamplesRepository } from './mongoose.repository.mock'

export const createSampleData: Partial<Sample> = {
    name: 'sample name'
}

export async function generateSampleData(repository: SamplesRepository): Promise<SampleDocument[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        const data = { ...createSampleData, name: `Sample_${padNumber(i, 3)}` }
        createPromises.push(repository.create(data))
    }

    const samples = await Promise.all(createPromises)

    return sortSamples(samples)
}

export function sortSamples(samples: SampleDocument[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...samples].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...samples].sort((a, b) => a.name.localeCompare(b.name))
}

function areDocsEqual(received: SampleDocument[], expected: SampleDocument[]) {
    if (received.length !== expected.length) {
        return {
            pass: false,
            message: () =>
                `Items length mismatch: received length ${received.length}, expected length ${expected.length}`
        }
    }

    for (let i = 0; i < received.length; i++) {
        if (!received[i].equals(expected[i])) {
            return {
                pass: false,
                message: () =>
                    `Document at index ${i} does not match: received: ${received[i]}, expected: ${expected[i]}`
            }
        }
    }

    return {
        pass: true,
        message: () => 'Documents match'
    }
}

expect.extend({
    toValidDocument(received, expected) {
        const pass = this.equals(received.toJSON(), {
            _id: expect.anything(),
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            version: expect.anything(),
            ...expected
        })

        const message = pass ? () => `expected document not to match` : () => `expected document to match`

        return { pass, message }
    },
    toDocumentsEqual(received, expected) {
        return areDocsEqual(received, expected)
    },
    toDocumentEqual(received, expected) {
        const pass = received.equals(expected)

        const message = pass ? () => `document not to match` : () => `document to match`

        return { pass, message }
    },
    toPaginationEqual(received, expected) {
        if (
            received.total !== expected.total ||
            received.take !== expected.take ||
            received.skip !== expected.skip
        ) {
            return {
                pass: false,
                message: () => `Pagination mismatch: received: ${received}, expected: ${expected}`
            }
        }

        return areDocsEqual(received, expected)
    }
})
