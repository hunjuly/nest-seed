# Data Mapper VS Active Record

아래 코드에서 entity.showingMovies을 사용하고 있는데 특정 theater에서 상영 중인 영화는 ScreeningService에서 관리한다.

```ts
// src/repository/TheaterRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TheaterEntity } from './entities/TheaterEntity';
import { Theater } from '../domain/models/Theater';

@Injectable()
export class TheaterRepository {
  constructor(
    @InjectRepository(TheaterEntity)
    private readonly theaterRepository: Repository<TheaterEntity>
  ) {}

  async findById(id: number): Promise<Theater | null> {
    const entity = await this.theaterRepository.findOne(id);
    if (!entity) return null;

    return new Theater(entity.id, entity.name, entity.location, entity.showingMovies);
  }

  // ... (다른 CRUD 연산)
}
```

Q: ScreeningService처럼 기능을 작은 서비스로 분리한다면 결국 도메인은 얇아지는 것 아니야? entity에 남는 코드는 적어지고 service의 코드가 늘어나는 것 아니야?

A:
네, 그렇게 될 수 있습니다. 도메인 모델이 "얇아지는" 현상은 "애너믹 도메인 모델(Anemic Domain Model)"이라고도 불립니다. 이는 도메인 로직이 서비스 레이어로 이동하게 되어, 객체 지향의 다형성, 상속, 캡슐화 등을 제대로 활용하기 어려워질 수 있습니다. 이로 인해, 도메인 모델 자체가 단순한 데이터 홀더(Data Holder)로 전락할 위험이 있습니다.

그러나 이 문제는 어떻게 서비스와 도메인을 설계하느냐에 달려 있습니다. "작은 서비스"로 분리하는 것이 반드시 나쁜 것은 아닙니다. 실제로 마이크로서비스 아키텍처나 서비스 지향 아키텍처(SOA)에서는 작은 서비스가 일반적으로 권장됩니다. 이 경우 중요한 것은 각 서비스가 어떤 책임을 갖는지 명확하게 정의하는 것입니다.

### 균형잡힌 접근 방법

1. **도메인 로직의 위치**: 도메인 모델이 가져야 할 핵심 비즈니스 로직을 정의하고, 이를 도메인 모델 내에 위치시킵니다.

2. **서비스의 책임**: 서비스는 여러 도메인 모델을 조정하거나, 복잡한 트랜잭션을 처리하는 등의 책임을 담당합니다. 이러한 로직은 도메인 모델 내에 위치하기 어렵습니다.

3. **코드 재사용**: 비슷한 로직이 여러 곳에서 사용된다면, 이를 별도의 도메인 서비스나 애플리케이션 서비스로 분리하여 코드 재사용성을 높일 수 있습니다.

4. **확장성과 유지보수**: 작은 서비스는 시스템을 더 유연하게 만들어 주지만, 과도하게 작은 서비스는 관리가 어렵고 복잡성을 증가시킬 수 있습니다. 적절한 수준에서 서비스를 분리하는 것이 중요합니다.

이러한 접근 방법을 통해 도메인 모델과 서비스 레이어가 각각 적절한 책임을 지고, 전체 아키텍처가 균형을 이룰 수 있습니다.
