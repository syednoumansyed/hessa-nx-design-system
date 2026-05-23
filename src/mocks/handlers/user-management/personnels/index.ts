import { ApiUrl } from '@shared/utils/api-url.util';
import { HttpResponse, http } from 'msw';
import { PersonnelsResponseMock } from './personnels.mock';

export const personnelsHandlers = [
  http.get(`${ApiUrl.v1BE}/personnels`, () => {
    return HttpResponse.json(PersonnelsResponseMock);
  }),
];
