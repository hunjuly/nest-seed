### Error: Invalid guard passed to @UseGuards() decorator

컨트롤러에서 @UseGuards()를 하면 아래처럼 에러 발생한다.

순환참조와 관련된 문제인데 import \* from 'src/auth' 이렇게 index.ts를 해서 발생했다.
index.ts는 모듈의 모든 코드를 export 하기 때문에 순환참조 문제가 발생하기 쉽다.

```
/workspaces/nestjs-ex/node_modules/@nestjs/common/utils/validate-each.util.js:21
        throw new InvalidDecoratorItemException(decorator, item, context.name);
              ^
Error: Invalid guard passed to @UseGuards() decorator (UsersController).
    at validateEach (/workspaces/nestjs-ex/node_modules/@nestjs/common/utils/validate-each.util.js:21:15)
    at /workspaces/nestjs-ex/node_modules/@nestjs/common/decorators/core/use-guards.decorator.js:35:51
    at DecorateProperty (/workspaces/nestjs-ex/node_modules/reflect-metadata/Reflect.js:553:33)
    at Reflect.decorate (/workspaces/nestjs-ex/node_modules/reflect-metadata/Reflect.js:123:24)
    at __decorate (/workspaces/nestjs-ex/dist/users/users.controller.js:4:92)
    at Object.<anonymous> (/workspaces/nestjs-ex/src/users/users.controller.ts:62:11)
    at Module._compile (node:internal/modules/cjs/loader:1256:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1310:10)
    at Module.load (node:internal/modules/cjs/loader:1119:32)
    at Function.Module._load (node:internal/modules/cjs/loader:960:12)
```
