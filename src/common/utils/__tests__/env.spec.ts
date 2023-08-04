import { isDevelopment, isProduction } from '../env'

it('common/utils/env', () => {
    const dev = isDevelopment()
    const prod = isProduction()

    expect(dev || prod).toBeTruthy()
})
