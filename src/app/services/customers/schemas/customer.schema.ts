import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'

@Schema()
export class Customer extends MongooseSchema {
    @Prop({ required: true })
    name: string

    @Prop({ unique: true, required: true })
    email: string

    @Prop({ required: true })
    birthday: Date

    @Prop({ required: true })
    password: string
}

export const CustomerSchema = createMongooseSchema(Customer)
CustomerSchema.index({ email: 1 })
CustomerSchema.index({ name: 'text' })

/*
1. `CustomerSchema.index({ email: 1 })`
   이 명령은 `email` 필드에 대해 오름차순(1) 인덱스를 생성합니다.

   - 목적: 이메일 주소로 고객을 빠르게 검색할 수 있게 합니다.
   - 작동 방식: MongoDB는 이메일 주소를 알파벳 순으로 정렬된 구조로 저장합니다.
   - 장점:
     - `findByEmail` 같은 쿼리의 성능을 크게 향상시킵니다.
     - 이메일 중복 체크를 빠르게 수행할 수 있습니다.
   - 사용 예: `db.customers.find({ email: "example@email.com" })`
   - 주의사항: 인덱스는 쓰기 작업의 성능을 약간 저하시킬 수 있지만, 읽기 작업의 이점이 더 큽니다.

2. `CustomerSchema.index({ name: 'text' })`
   이 명령은 `name` 필드에 대해 텍스트 인덱스를 생성합니다.

   - 목적: 고객 이름에 대한 전체 텍스트 검색을 가능하게 합니다.
   - 작동 방식: MongoDB는 이름 필드의 각 단어를 개별적으로 인덱싱합니다.
   - 장점:
     - 부분 일치, 다중 단어 검색 등 복잡한 이름 검색을 효율적으로 수행할 수 있습니다.
     - 검색 결과의 관련성 점수를 제공합니다.
   - 사용 예: `db.customers.find({ $text: { $search: "John Doe" } })`
   - 특징:
     - 대소문자를 구분하지 않습니다.
     - 기본적으로 불용어(stop words)를 제거합니다.
     - 스템밍(stemming)을 지원하여 유사한 단어도 검색됩니다.
*/
