export type ServiceError = {
  status?: number;
  message: string;
  data?: unknown;
};

export function unwrapResponseData<T>(payload: unknown): T {
  const data = payload as { data?: unknown; result?: unknown };
  if (data?.data !== undefined) return data.data as T;
  if (data?.result !== undefined) return data.result as T;
  return payload as T;
}

export function toServiceError(error: unknown, fallbackMessage: string): ServiceError {
  const err = error as {
    status?: number;
    message?: string;
    data?: { error?: { message?: string }; meta?: { message?: string } };
  };

  const message =
    err?.message ||
    err?.data?.error?.message ||
    err?.data?.meta?.message ||
    fallbackMessage;

  return {
    status: err?.status,
    message,
    data: err?.data,
  };
}

export function normalizeServiceError(error: unknown, fallbackMessage: string): never {
  throw toServiceError(error, fallbackMessage);
}
