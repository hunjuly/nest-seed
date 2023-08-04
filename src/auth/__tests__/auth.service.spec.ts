import { TestingModule } from '@nestjs/testing'
import * as jwt from 'jsonwebtoken'
import { createTestModule } from 'src/common/test'
import { GlobalModule } from 'src/global'
import { AuthModule } from '../auth.module'
import { AuthService } from '../auth.service'
import { AuthConfigService } from '../services'

describe('AuthService', () => {
    let authService: AuthService
    let config: AuthConfigService
    let module: TestingModule

    beforeEach(async () => {
        module = await createTestModule({
            imports: [GlobalModule, AuthModule]
        })

        authService = module.get(AuthService)
        config = module.get(AuthConfigService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('refreshTokenPair', () => {
        it('토큰 페이로드에서 userId가 누락된 경우 null을 반환해야 합니다', async () => {
            const invalidToken = jwt.sign({}, config.refreshSecret, { expiresIn: '15m' })
            const tokenPair = await authService.refreshTokenPair(invalidToken)

            expect(tokenPair).toBeNull()
        })

        it('토큰 페이로드의 userId가 유효하지 않은 경우 null을 반환해야 합니다', async () => {
            const invalidToken = jwt.sign({ userId: 'invalid' }, config.refreshSecret, { expiresIn: '15m' })
            const tokenPair = await authService.refreshTokenPair(invalidToken)

            expect(tokenPair).toBeNull()
        })
    })
})
