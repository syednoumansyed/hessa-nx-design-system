import { ApiParam } from '@core/api-services/role-api/dto/role.dto';

type ResetPageNumber = Omit<ApiParam, 'schoolId' | 'academicYearId'>;
export const isResetPageNumber = (
  oldParam: ResetPageNumber,
  newParam: ResetPageNumber,
): boolean => {
  return (
    oldParam.order !== newParam.order ||
    oldParam.itemsPerPage !== newParam.itemsPerPage ||
    oldParam.sortByColumn !== newParam.sortByColumn
  );
};
