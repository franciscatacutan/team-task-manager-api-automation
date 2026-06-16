import { test, expect } from "@playwright/test";

import { AuthClient } from "../../../src/api/AuthClient";
import { AuthResponse } from "../../../src/models/auth/AuthResponse";
import { ErrorResponse } from "../../../src/models/common/ErrorResponse";
import { UserRole } from "../../../src/models/auth/UserRole";
import { env } from "../../../src/config/env";

test.describe("Authentication - Login", () => {
  let authClient: AuthClient;

  test.beforeEach(async ({ request }) => {
    authClient = new AuthClient(request);
  });

  test("should authenticate valid super admin", async () => {
    const response = await authClient.login({
      email: env.testEmail,
      password: env.testPassword,
    });

    expect(response.status()).toBe(200);

    const body: AuthResponse = await response.json();

    expect(body).toMatchObject({
      token: expect.any(String),
      expiresInSeconds: expect.any(Number),

      user: {
        userId: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: env.testEmail,
        role: UserRole.SUPER_ADMIN,
      },
    });

    expect(body.token.length).toBeGreaterThan(100);
    expect(body.expiresInSeconds).toBeGreaterThan(0);
  });

  test("should reject invalid password", async () => {
    const response = await authClient.login({
      email: env.testEmail,
      password: "WrongPassword123!",
    });

    expect(response.status()).toBe(401);

    const body: ErrorResponse = await response.json();

    expect(body.status).toBe(401);
    expect(body.message).toBeTruthy();
  });

  test("should reject unknown email", async () => {
    const response = await authClient.login({
      email: "unknown@test.com",
      password: env.testPassword,
    });

    expect(response.status()).toBe(401);

    const body: ErrorResponse = await response.json();

    expect(body.status).toBe(401);
    expect(body.message).toBeTruthy();
  });

  test("should reject empty credentials", async () => {
    const response = await authClient.login({
      email: "",
      password: "",
    });

    expect(response.status()).toBe(400);
  });

  test("should reject invalid email format", async () => {
    const response = await authClient.login({
      email: "invalid-email",
      password: env.testPassword,
    });

    expect(response.status()).toBe(400);
  });
});
