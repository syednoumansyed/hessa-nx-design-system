import { ApiUrl } from '@shared/utils/api-url.util';
import { HttpResponse, http } from 'msw';
import { academicYearsResponse } from './academic-years.mock';

export const AcademicYearHandlers = [
  http.get(`${ApiUrl.v1BE}/academic-years`, () => {
    return HttpResponse.json(academicYearsResponse);
  }),
  http.post(`${ApiUrl.v1BE}/academic-year`, () => HttpResponse.json({})),
  http.put(`${ApiUrl.v1BE}/academic-year/:id`, () => HttpResponse.json({})),
  http.delete(`${ApiUrl.v1BE}/academic-year/:id`, () => HttpResponse.json({})),
];
