import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiResponse } from "../types";

/**
 * Standard error message structure for the application
 */
export class AppError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode = 400, errorCode?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * API-specific error class
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

/**
 * Creates a properly formatted error object from any error type
 */
export function formatError(error: unknown): {
  message: string;
  statusCode: number;
  errorCode?: string;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
    };
  } else if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  } else if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  } else if (typeof error === "string") {
    return {
      message: error,
      statusCode: 500,
    };
  } else {
    return {
      message: "An unexpected error occurred",
      statusCode: 500,
    };
  }
}

/**
 * Service operation result type
 */
export type Result<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { message: string; statusCode: number; errorCode?: string };
    };

/**
 * Helper to create a success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result
 */
export function failure<T>(error: unknown): Result<T> {
  return { success: false, error: formatError(error) };
}

/**
 * Validates data against a Zod schema and returns a Result
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T> {
  try {
    const validatedData = schema.parse(data);
    return success(validatedData);
  } catch (error) {
    return failure<T>(
      new AppError(
        "Validation failed: " +
          (error instanceof z.ZodError ? error.message : "Invalid data"),
        400,
        "VALIDATION_ERROR",
      ),
    );
  }
}

/**
 * Wraps an async function with consistent error handling
 */
export async function safeAsync<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure<T>(error);
  }
}

/**
 * Wraps an API route with error handling
 */
export function withErrorHandling<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>,
) {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, status: error.statusCode },
          { status: error.statusCode },
        );
      }

      // For other types of errors
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json(
        { error: errorMessage, status: 500 },
        { status: 500 },
      );
    }
  };
}

/**
 * Validates that a user is authenticated
 */
export function assertAuthenticated(
  authToken: string | undefined | null,
): void {
  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }
}

/**
 * Validates that required data fields are present
 */
export function assertValidData<T extends Record<string, any>>(
  data: T,
  requiredFields: Array<keyof T>,
): void {
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missingFields.join(", ")}`,
      400,
    );
  }
}
