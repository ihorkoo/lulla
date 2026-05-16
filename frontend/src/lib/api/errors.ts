import { z } from "zod";

export const ApiErrorSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string().optional(),
  code: z.string(),
  request_id: z.string().nullable().optional(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        code: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export class ApiException extends Error {
  readonly payload: ApiError;
  readonly status: number;

  constructor(payload: ApiError) {
    super(payload.detail ?? payload.title);
    this.name = "ApiException";
    this.payload = payload;
    this.status = payload.status;
  }

  get code(): string {
    return this.payload.code;
  }

  fieldError(field: string): string | undefined {
    return this.payload.errors?.find((e) => e.field === field)?.message;
  }
}

export async function parseApiError(response: Response): Promise<ApiException> {
  try {
    const json = await response.json();
    const parsed = ApiErrorSchema.parse(json);
    return new ApiException(parsed);
  } catch {
    return new ApiException({
      type: "internal_error",
      title: "Request failed",
      status: response.status,
      detail: response.statusText,
      code: "INTERNAL_ERROR",
    });
  }
}
