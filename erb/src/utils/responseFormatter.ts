// utils/responseFormatter.ts

export const formatResponse = (
  statusCode: number,
  message: string,
  data: any = null,
  pagination: any = null
) => ({
  meta: {
    status: statusCode,
    success: true,
    message,
    ...(pagination && { pagination }),
  },
  data,
});