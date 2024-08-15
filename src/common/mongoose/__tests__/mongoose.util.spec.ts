import { expect } from '@jest/globals'
import {
    newObjectId,
    objectId,
    ObjectId,
    objectIds,
    objectIdToString,
    stringToObjectId
} from 'common'
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

    describe('ObjectId utility functions', () => {
        describe('objectId', () => {
            it('should convert a string to an ObjectId', () => {
                const idString = '507f1f77bcf86cd799439011'
                const result = objectId(idString)

                expect(result).toBeInstanceOf(ObjectId)
                expect(result.toString()).toBe(idString)
            })

            it('should throw an error for invalid ObjectId strings', () => {
                const invalidId = 'invalid-id'

                expect(() => objectId(invalidId)).toThrow()
            })
        })

        describe('objectIds', () => {
            it('should convert an array of strings to an array of ObjectIds', () => {
                const idStrings = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
                const result = objectIds(idStrings)

                expect(result).toHaveLength(2)
                result.forEach((id, index) => {
                    expect(id).toBeInstanceOf(ObjectId)
                    expect(id.toString()).toBe(idStrings[index])
                })
            })

            it('should return an empty array when given an empty array', () => {
                const result = objectIds([])

                expect(result).toEqual([])
            })

            it('should throw an error if any string in the array is invalid', () => {
                const idStrings = ['507f1f77bcf86cd799439011', 'invalid-id']

                expect(() => objectIds(idStrings)).toThrow()
            })
        })
    })
})
