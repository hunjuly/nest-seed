import { Test, TestingModule } from '@nestjs/testing'
import { LogicException } from 'src/common'
import { AuthController } from '../auth.controller'
import { AuthService } from '../auth.service'
import { UsersService } from '../users.service'

describe('AuthController', () => {
    let authController: AuthController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: {} },
                { provide: UsersService, useValue: {} }
            ]
        }).compile()

        authController = module.get(AuthController)
    })

    it('should throw exception if req.user is null during login', async () => {
        const req = { user: null }

        await expect(authController.login(req)).rejects.toThrow(LogicException)
    })

    // it('should throw exception if req.user is null when getting profile', () => {
    //     const req = { user: null }

    //     expect(() => authController.getUser(req)).toThrow(LogicException)
    // })
})
