import { ApiResponse } from "@/app/types";
import { NextRequest, NextResponse } from "next/server";
import { AppError, Result, safeAsync } from "./errorUtils";

/**
 * Generic API service options
 */
export interface ApiServiceOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

/**
 * Base configuration for all API services
 */
const DEFAULT_OPTIONS: ApiServiceOptions = {
  baseUrl: "",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Validate authentication token
 */
export function validateToken(req: NextRequest): {
  isValid: boolean;
  message?: string;
} {
  const authToken = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!authToken) {
    return { isValid: false, message: "Authentication token is required" };
  }
  return { isValid: true };
}

/**
 * Create error response
 */
export function errorResponse<T = any>(
  message: string,
  status = 400,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ error: message, status }, { status });
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, status }, { status });
}

/**
 * Validate request body for required fields
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: T,
  requiredFields: (keyof T)[],
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => !body[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields as string[],
  };
}

/**
 * Sanitize input with maximum length
 */
export function sanitizeInput(input: string, maxLength = 15000): string {
  return input.slice(0, maxLength).trim();
}

/**
 * Generic base API service for CRUD operations
 */
export class ApiService<T extends { id: string }> {
  protected endpoint: string;
  protected options: ApiServiceOptions;

  constructor(endpoint: string, options: ApiServiceOptions = {}) {
    this.endpoint = endpoint;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Sets the authentication token for requests
   */
  setAuthToken(token: string): void {
    this.options = {
      ...this.options,
      headers: {
        ...this.options.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }

  /**
   * Creates the full URL for an API endpoint
   */
  protected getUrl(path = ""): string {
    const base = this.options.baseUrl || "";
    const endpoint = this.endpoint.startsWith("/")
      ? this.endpoint
      : `/${this.endpoint}`;

    return `${base}${endpoint}${path ? `/${path}` : ""}`;
  }

  /**
   * Fetches all items
   */
  async fetchAll(): Promise<Result<T[]>> {
    return safeAsync(async () => {
      const response = await fetch(this.getUrl(), {
        headers: this.options.headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new AppError(
          `Failed to fetch ${this.endpoint}: ${response.status} ${errorData?.error || ""}`,
          response.status,
        );
      }

      const data = await response.json();
      return data.data || [];
    });
  }

  /**
   * Fetches a single item by ID
   */
  async fetchById(id: string): Promise<Result<T>> {
    return safeAsync(async () => {
      const response = await fetch(this.getUrl(id), {
        headers: this.options.headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new AppError(
          `Failed to fetch ${this.endpoint} with ID ${id}: ${response.status} ${errorData?.error || ""}`,
          response.status,
        );
      }

      const data = await response.json();
      return data.data;
    });
  }

  /**
   * Creates a new item
   */
  async create(data: Omit<T, "id">): Promise<Result<string>> {
    return safeAsync(async () => {
      const response = await fetch(this.getUrl(), {
        method: "POST",
        headers: this.options.headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new AppError(
          `Failed to create ${this.endpoint}: ${response.status} ${errorData?.error || ""}`,
          response.status,
        );
      }

      const responseData = await response.json();
      
      // Handle various response formats
      if (responseData.data?.id) {
        return responseData.data.id;
      } else if (responseData.planId) {
        return responseData.planId;
      } else if (responseData.id) {
        return responseData.id;
      } else {
        console.error("Response doesn't contain expected ID format:", responseData);
        throw new AppError(
          `Invalid response format from ${this.endpoint}: No ID found`,
          500
        );
      }
    });
  }

  /**
   * Updates an existing item
   */
  async update(id: string, updates: Partial<T>): Promise<Result<void>> {
    return safeAsync(async () => {
      const response = await fetch(this.getUrl(id), {
        method: "PUT",
        headers: this.options.headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new AppError(
          `Failed to update ${this.endpoint} with ID ${id}: ${response.status} ${errorData?.error || ""}`,
          response.status,
        );
      }
    });
  }

  /**
   * Deletes an item
   */
  async delete(id: string): Promise<Result<void>> {
    return safeAsync(async () => {
      const response = await fetch(this.getUrl(id), {
        method: "DELETE",
        headers: this.options.headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new AppError(
          `Failed to delete ${this.endpoint} with ID ${id}: ${response.status} ${errorData?.error || ""}`,
          response.status,
        );
      }
    });
  }
}
