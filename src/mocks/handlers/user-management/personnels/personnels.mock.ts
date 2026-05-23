import { Personnel } from '@shared/dto-transformation';
import { IPaginatedResponse } from '@shared/interfaces';

const mockPersonnels: Personnel[] = [];

export const PersonnelsResponseMock: IPaginatedResponse<Personnel[]> = {
  data: mockPersonnels,
  paginate: {
    pageNumber: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 9,
  },
};
