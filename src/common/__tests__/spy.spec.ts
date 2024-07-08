import * as SpyModule from './spy.fixture'

describe('spy examples', () => {
    it('should ensure that the function is mocked', () => {
        expect(SpyModule.getGreeting()).toEqual('Greeting')

        const mockFunc = jest.spyOn(SpyModule, 'getGreeting').mockReturnValue('Mocked Value')

        expect(SpyModule.getGreeting()).toEqual('Mocked Value')
        expect(mockFunc).toHaveBeenCalled()

        mockFunc.mockRestore()
    })

    it('should ensure that the function within the same file is properly mocked', () => {
        const localObj = {
            getHello() {
                return 'Hello'
            }
        }

        const mockFunc = jest.spyOn(localObj, 'getHello').mockReturnValue('Mocked Value')

        expect(localObj.getHello()).toEqual('Mocked Value')
        expect(mockFunc).toHaveBeenCalled()

        mockFunc.mockRestore()
    })
})
