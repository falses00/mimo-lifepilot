export interface ApiResponse<T> {
  data: T;
  meta: {
    mode: string;
    durationMs: number;
  };
}

export interface ApiError {
  error: string;
  code?: string;
}
