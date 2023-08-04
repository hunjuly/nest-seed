import { isDevelopment, isProduction } from '../environment'

it('common/utils/env', () => {
    const dev = isDevelopment()
    const prod = isProduction()

    expect(dev || prod).toBeTruthy()
})
