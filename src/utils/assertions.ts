import { APIResponse, expect } from "@playwright/test";
import { AuthResponse } from "../models/auth/AuthResponse";
import { ErrorResponse } from "../models/common/ErrorResponse";

/**
 * Assertion helpers — centralise structural validation so tests
 * only assert on the business-specific values they actually care about.
 *
 * Benefits:
 * - One place to update if the response schema changes.
 * - Tests read at a higher level of abstraction ("assert it's a valid auth response")
 *   rather than repeating `toMatchObject` boilerplate everywhere.
 */

/**
 * Asserts that a response is a valid 200 AuthResponse and returns the parsed body.
 * Guarantees the caller receives a fully-typed, structurally-valid object.
 */
export async function assertAuthResponse(
  response: APIResponse,
): Promise<AuthResponse> {
  expect(response.status()).toBe(200);

  const body: AuthResponse = await response.json();

  expect(body).toMatchObject({
    token: expect.any(String),
    expiresInSeconds: expect.any(Number),
    user: {
      userId: expect.any(String),
      firstName: expect.any(String),
      lastName: expect.any(String),
      email: expect.any(String),
      role: expect.any(String),
    },
  });

  // Token must be non-empty — a structural guarantee beyond just "any String"
  expect(body.token.trim().length).toBeGreaterThan(0);
  expect(body.expiresInSeconds).toBeGreaterThan(0);

  return body;
}

/**
 * Asserts that a response body conforms to the ErrorResponse schema
 * and returns the parsed body for further test-specific assertions.
 */
export async function assertErrorResponse(
  response: APIResponse,
): Promise<ErrorResponse> {
  const body: ErrorResponse = await response.json();

  expect(body).toMatchObject({
    status: expect.any(Number),
    message: expect.any(String),
  });

  expect(body.message.trim().length).toBeGreaterThan(0);

  return body;
}
