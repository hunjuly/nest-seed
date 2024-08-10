import { expect } from '@jest/globals'
import { newObjectId, ObjectId, objectIdToString, stringToObjectId } from 'common'
import { Types } from 'mongoose'

describe('MongooseRepository Utils', () => {
    const input = {
        number: 123,
        date: new Date(0),
        boolean: true,
        objectId: new ObjectId('000000000000000000000001'),
        stringId: '000000000000000000000002',
        objectIds: [
            new ObjectId('000000000000000000000001'),
            new ObjectId('000000000000000000000001')
        ],
        stringIds: ['000000000000000000000002', '000000000000000000000002'],
        regex: /test/,
        null: null
    }

    it('stringToObjectId', async () => {
        const converted = stringToObjectId(input)

        expect(converted).toEqual({
            ...input,
            stringId: new ObjectId('000000000000000000000002'),
            stringIds: [
                new ObjectId('000000000000000000000002'),
                new ObjectId('000000000000000000000002')
            ]
        })
    })

    it('objectIdToString', async () => {
        const converted = objectIdToString(input)

        expect(converted).toEqual({
            ...input,
            objectId: '000000000000000000000001',
            objectIds: ['000000000000000000000001', '000000000000000000000001']
        })
    })

    it('createObjectId', async () => {
        const objectId = newObjectId()

        expect(Types.ObjectId.isValid(objectId)).toBeTruthy()
    })
})
