import { PaginationResult, padNumber } from 'common'
import { isEqual } from 'lodash'
import { Sample, SampleDocument, SamplesRepository } from './mongoose.repository.mock'

export const createSampleData: Partial<Sample> = {
    name: 'sample name'
}

export function sortAsc(samples: SampleDocument[]) {
    return [...samples].sort((a, b) => a.name.localeCompare(b.name))
}
export function sortDesc(samples: SampleDocument[]) {
    return [...samples].sort((b, a) => a.name.localeCompare(b.name))
}

export async function isDocumentValid(
    document: SampleDocument,
    createData: Partial<Sample>
): Promise<boolean> {
    const entityBase = {
        _id: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
        version: expect.anything()
    }

    return isEqual(document.toJSON(), {
        ...entityBase,
        ...createData
    })
}

function areDocsEqual(a: SampleDocument[], b: SampleDocument[]) {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        if (!a[i].equals(b[i])) {
            console.log(`Difference found at index ${i}:`, 'a:', a[i], 'b:', b[i])
            return false
        }
    }

    return true
}

function arePaginationEqual(a: PaginationResult<SampleDocument>, b: PaginationResult<SampleDocument>) {
    if (a.total !== b.total || a.take !== b.take || a.skip !== b.skip) {
        console.log('Pagination mismatch:', 'a:', a, 'b:', b)
        return false
    }

    return areDocsEqual(a.items, b.items)
}

expect.extend({
    toPaginationEqual(received, expected) {
        const pass = arePaginationEqual(received, expected)
        const message = pass ? () => `expected pagination not to match` : () => `expected pagination to match`

        return { pass, message }
    },
    toDocumentsEqual(received, expected) {
        const pass = areDocsEqual(received, expected)
        const message = pass ? () => `expected document not to match` : () => `expected document to match`

        return { pass, message }
    }
})

export const generateSampleData = async (repository: SamplesRepository): Promise<SampleDocument[]> => {
    const samples: SampleDocument[] = []

    for (let i = 0; i < 100; i++) {
        const data = { ...createSampleData, name: `Sample_${padNumber(i, 3)}` }
        const createdSample = await repository.create(data)

        samples.push(createdSample)
    }

    return samples
}
