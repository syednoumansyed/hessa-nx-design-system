import { AcademicYearsResponseDTO } from '@pages/academic-year/data-access/academic-year.dto';

export const academicYearsResponse: AcademicYearsResponseDTO = {
  data: [
    {
      id: 1,
      name: '2021-2022',
      startDate: '2021-09-01',
      endDate: '2022-06-30',
      semesters: [
        {
          id: '1',
          name: 'Fall Semester',
          startDate: '2021-09-01',
          endDate: '2021-12-31',
          academicYearId: 1,
        },
        {
          id: '2',
          name: 'Spring Semester',
          startDate: '2022-01-01',
          endDate: '2022-06-30',
          academicYearId: 1,
        },
        {
          id: '3',
          name: 'Semester 1',
          startDate: '2021-09-01',
          endDate: '2021-12-31',
          academicYearId: 1,
        },
        {
          id: '4',
          name: 'Semester 2',
          startDate: '2022-01-01',
          endDate: '2022-06-30',
          academicYearId: 1,
        },
      ],
    },
  ],
  paginate: {
    itemsPerPage: 10,
    pageNumber: 1,
    totalItems: 3,
    totalPages: 1,
  },
};
