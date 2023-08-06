import { isProduction, isDevelopment, envFilename, addItemInDevelopment } from '../environment'

describe('common/utils/environment', () => {
    it('NODE_ENV=production', () => {
        process.env.NODE_ENV = 'production'

        expect(isProduction()).toEqual(true)
        expect(envFilename()).toEqual('.env.production')
        expect(addItemInDevelopment(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b'])
    })

    it('NODE_ENV=development', () => {
        process.env.NODE_ENV = 'development'

        expect(isDevelopment()).toEqual(true)
        expect(envFilename()).toEqual('.env.development')
        expect(addItemInDevelopment(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd'])
    })
})
