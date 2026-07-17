export interface ListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  sort?: string;
  fields?: string;
  [key: string]: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ResponseMeta {
  status?: number;
  success?: boolean;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ListResponse<T> {
  data: T[];
  meta: ResponseMeta;
}

export interface ItemResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ApiDeleteResponse {
  data: unknown;
  meta?: ResponseMeta;
}
