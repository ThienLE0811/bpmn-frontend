export interface ApiErrorDetail {
  errorCode: string | number;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  status: 'OK' | 'FAIL';
  data: T;
  errors?: ApiErrorDetail | null;
}
