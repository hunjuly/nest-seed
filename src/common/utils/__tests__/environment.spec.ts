import { isProduction, isDevelopment, envFilename, ADD_DEV } from '../environment'

describe('common/utils/environment', () => {
    it('NODE_ENV=production', () => {
        process.env.NODE_ENV = 'production'

        expect(isProduction()).toEqual(true)
        expect(envFilename()).toEqual('.env.production')
        expect(ADD_DEV(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b'])
    })

    it('NODE_ENV=development', () => {
        process.env.NODE_ENV = 'development'

        expect(isDevelopment()).toEqual(true)
        expect(envFilename()).toEqual('.env.development')
        expect(ADD_DEV(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd'])
    })
})
