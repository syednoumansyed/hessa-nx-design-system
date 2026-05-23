import { http, HttpResponse } from 'msw';
import { LevelMockResponse } from './level.mock';
import { LevelsMockResponse } from './levels.mock';
import { ApiUrl } from '@shared/utils/api-url.util';

export const RoleHandlers = [
  http.get(`${ApiUrl.v1BE}/level/:id`, () => {
    return HttpResponse.json({ data: LevelMockResponse });
  }),
  http.get(`${ApiUrl.v1BE}/levels`, () => {
    return HttpResponse.json({ data: LevelsMockResponse });
  }),
];
