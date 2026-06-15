import { test, expect } from "@playwright/test";
import { AuthClient } from "../../../src/api/AuthClient";
import { AuthResponse } from "../../../src/models/auth/AuthResponse";
import { env } from "../../../src/config/env";
import { UserRole } from "../../../src/models/auth/UserRole";

test("should login successfully", async ({ request }) => {
  const authClient = new AuthClient(request);

  const response = await authClient.login({
    email: env.testEmail,
    password: env.testPassword,
  });

  expect(response.status()).toBe(200);

  const body: AuthResponse = await response.json();

  expect(body.token).toBeTruthy();

  expect(body.expiresInSeconds).toBeGreaterThan(0);

  expect(body.user.userId).toBeTruthy();

  expect(body.user.email).toBe(env.testEmail);

  expect(body.user.firstName).toBeTruthy();

  expect(body.user.lastName).toBeTruthy();

  expect(body.user.role).toBe(UserRole);
});
