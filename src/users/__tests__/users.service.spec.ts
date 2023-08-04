import { TestingModule } from '@nestjs/testing'
import { plainToInstance } from 'class-transformer'
import { LogicException } from 'src/common'
import { createTestModule } from 'src/common/test'
import { UpdateUserDto } from '../dto'
import { User } from '../entities'
import { UsersRepository } from '../users.repository'
import { UsersService } from '../users.service'

jest.mock('../users.repository')

describe('UsersService', () => {
    let module: TestingModule
    let service: UsersService

    const mockRepository = {
        findById: jest.fn(),
        update: jest.fn()
    }

    beforeEach(async () => {
        module = await createTestModule({
            providers: [
                UsersService,
                {
                    provide: UsersRepository,
                    useValue: mockRepository
                }
            ]
        })

        service = module.get(UsersService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(service).toBeDefined()
    })

    it('should throw a LogicException if user does not exist', async () => {
        // user를 찾을 수 없을 때 null을 반환하도록 설정
        mockRepository.findById.mockResolvedValue(null)

        await expect(service.getUser('userId')).rejects.toThrow(LogicException)
    })

    it('should throw a LogicException if savedUser and updatedUser are not the same', async () => {
        const userId = '123'
        const updateUserDto = { email: 'new@mail.com' } as UpdateUserDto

        const user = { id: userId, email: 'user@mail.com' }

        mockRepository.findById.mockResolvedValue(user)
        mockRepository.update.mockResolvedValue(user) // updatedUser가 아닌 원래의 user를 반환하도록 설정

        const promise = service.updateUser(userId, updateUserDto)

        await expect(promise).rejects.toThrow(LogicException)
    })

    it('시리얼라이제이션에서 비밀번호를 제외해야 합니다', () => {
        const user = plainToInstance(User, {
            id: '1',
            name: 'John',
            password: 'secret'
        })
        expect(user.password).toBeUndefined()
        expect(JSON.stringify(user)).not.toContain('password')
    })

    it('시리얼라이제이션에 birthdate가 포함되어야 합니다', () => {
        const user = plainToInstance(User, {
            id: '1',
            name: 'John',
            birthdate: new Date('1990-01-01')
        })
        expect(user.birthdate).toBeInstanceOf(Date)
        expect(user.birthdate.getFullYear()).toEqual(1990)
        expect(JSON.stringify(user)).toContain('birthdate')
    })
})
