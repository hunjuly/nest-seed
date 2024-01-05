# Troubleshooting

다양한 오류 상황과 해결 방법을 정리했다.

## Error: Invalid guard passed to @UseGuards() decorator

컨트롤러에서 @UseGuards()를 사용하면서 발생했다.

모듈에 index.ts를 작성하고 모든 요소를 export 해서 순환참조 오류가 생겼다.

```
/workspaces/nest-seed/node_modules/@nestjs/common/utils/validate-each.util.js:21
        throw new InvalidDecoratorItemException(decorator, item, context.name);
              ^
Error: Invalid guard passed to @UseGuards() decorator (UsersController).
    at validateEach (/workspaces/nest-seed/node_modules/@nestjs/common/utils/validate-each.util.js:21:15)
    at /workspaces/nest-seed/node_modules/@nestjs/common/decorators/core/use-guards.decorator.js:35:51
    at DecorateProperty (/workspaces/nest-seed/node_modules/reflect-metadata/Reflect.js:553:33)
    at Reflect.decorate (/workspaces/nest-seed/node_modules/reflect-metadata/Reflect.js:123:24)
    at __decorate (/workspaces/nest-seed/dist/users/users.controller.js:4:92)
    at Object.<anonymous> (/workspaces/nest-seed/src/users/users.controller.ts:62:11)
    at Module._compile (node:internal/modules/cjs/loader:1256:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1310:10)
    at Module.load (node:internal/modules/cjs/loader:1119:32)
    at Function.Module._load (node:internal/modules/cjs/loader:960:12)
```
