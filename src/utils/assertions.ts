import { APIResponse, expect } from "@playwright/test";
import { AuthResponse } from "../models/auth/AuthResponse";
import { ErrorResponse } from "../models/common/ErrorResponse";

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

  expect(typeof body.token).toBe("string");
  expect(body.token.trim().length).toBeGreaterThan(0);
  expect(body.expiresInSeconds).toBeGreaterThan(0);

  return body;
}

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

export async function assertRegisterResponse(
  response: APIResponse,
): Promise<AuthResponse> {
  expect(response.status()).toBe(201);

  const body: AuthResponse = await response.json();

  expect(body).toMatchObject({
    user: {
      userId: expect.any(String),
      firstName: expect.any(String),
      lastName: expect.any(String),
      email: expect.any(String),
      role: expect.any(String),
    },
  });

  if (body.token !== undefined) {
    expect(typeof body.token).toBe("string");
    expect(body.token.trim().length).toBeGreaterThan(0);
    expect(body.expiresInSeconds).toBeGreaterThan(0);
  }

  return body;
}
