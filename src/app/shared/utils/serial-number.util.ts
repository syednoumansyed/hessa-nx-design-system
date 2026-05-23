import { IPagination } from '@shared/interfaces/api.interface';

/**
 * Calculates the serial number for a row in a paginated list.
 * @param index Index of the item in the current page (0-based)
 * @param paginate Pagination object from IPagination
 */
export function getSerialNumberFromPaginate(
  index: number,
  paginate: IPagination,
): number {
  return (paginate.pageNumber - 1) * paginate.itemsPerPage + index + 1;
}
