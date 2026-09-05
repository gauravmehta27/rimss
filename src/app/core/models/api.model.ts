export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sort?: string;
}

export interface ApiError {
  code: string;
  message: string;
  correlationId?: string;
  status?: number;
}
