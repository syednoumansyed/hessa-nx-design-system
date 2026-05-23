# MSW (Mock service worker)

## introduction

Mock Service Worker (MSW) is an API mocking library for browser and Node.js. With MSW, you can intercept outgoing requests, observe them, and respond to them using mocked responses.

## Run

`npm run mock`

## Adding new mock

To add new mock you need to create .mock.ts file where you have mock respoonse.

roles.mocks.ts

```ts
export const RoleListingMock: IPaginatedResponse<RolesResponseDataDTO> = {
  data: [
    {
      id: 21,
      name: "Teacher222",
      createdAt: "2024-02-01T10:41:39.000Z",
      updatedAt: "2024-02-01T10:41:39.000Z",
      createdBy: null,
    },
    {
      id: 22,
      name: "student-create",
      createdAt: "2024-02-01T10:55:05.000Z",
      updatedAt: "2024-02-01T10:55:05.000Z",
      createdBy: null,
    },
  ],
  paginate: {
    pageNumber: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 9,
  },
};
```

than we need to register http method like `get, post, delete, put` and return the mock response.

roles/index.ts

```ts
export const RoleHandlers = [
  http.get(`${environment.BE_API_BASE_URL}/roles`, () => {
    return HttpResponse.json(RoleListingMock);
  }),
];
```

handlers/index.ts

```ts
import { RoleHandlers } from "./roles";

export const handlers = [...RoleHandlers];
```

for more information check following documentation

1. [Mock server worker docs](https://mswjs.io/docs)
2. [MSW integration with angular](https://github.dev/mswjs/examples/with-angular)
