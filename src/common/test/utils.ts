export function objToJson(obj: any) {
    const plain = JSON.stringify(obj)
    const json = JSON.parse(plain)

    return json
}

export function createSpy(object: any, method: string, args: any[] | undefined | null, response: any) {
    return jest.spyOn(object, method).mockImplementation(async (...recv) => {
        if (args) {
            expect(recv).toEqual(args)
        }

        return response
    })
}

export const aggregateRootMock = {
    createdAt: expect.anything(),
    id: expect.anything(),
    updatedAt: expect.anything(),
    version: expect.anything()
}
