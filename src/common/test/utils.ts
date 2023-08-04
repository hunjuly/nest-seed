export const nullUUID = '00000000000000000000000000000000'

export function createUUID(value: number) {
    const uuid = String(value).padStart(32, '0')
    const formattedUUID = uuid.slice(-32)
    return formattedUUID
}

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
