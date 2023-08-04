import { Test, TestingModule } from '@nestjs/testing'
import { LogicException } from 'src/common'
import { AuthController } from '../auth.controller'
import { AuthService } from '../auth.service'

describe('AuthController', () => {
    let authController: AuthController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: {} }]
        }).compile()

        authController = module.get<AuthController>(AuthController)
    })

    it('should throw exception if req.user is null during login', async () => {
        const req = { user: null }

        await expect(authController.login(req)).rejects.toThrow(LogicException)
    })

    it('should throw exception if req.user is null when getting profile', () => {
        const req = { user: null }

        expect(() => authController.getProfile(req)).toThrow(LogicException)
    })
})
