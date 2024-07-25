export function createSpy(
    object: any,
    method: string,
    args: any[] | undefined | null,
    response: any
) {
    return jest.spyOn(object, method).mockImplementation(async (...recv) => {
        if (args) {
            expect(recv).toEqual(args)
        }

        return response
    })
}
