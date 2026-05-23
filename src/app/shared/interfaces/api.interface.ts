export interface IPaginatedResponse<T> {
  data: T;
  paginate: IPagination;
}

export interface IResponse<T> {
  message: string;
  data: T;
}

export interface IPagination {
  itemsPerPage: number;
  pageNumber: number;
  totalItems: number;
  totalPages: number;
}

export type IPaginationParams = {
  pageNumber?: number;
  itemsPerPage?: number;
  sortByColumn?: string;
  order?: 'asc' | 'desc';
};
