import { test, expect } from "@playwright/test";

import { AuthClient } from "../../../src/api/AuthClient";
import { AuthResponse } from "../../../src/models/auth/AuthResponse";
import { env } from "../../../src/config/env";

test.describe("Authentication - Token Validation", () => {
  test("should access protected endpoint with valid token", async ({
    request,
  }) => {
    const authClient = new AuthClient(request);

    const loginResponse = await authClient.login({
      email: env.testEmail,
      password: env.testPassword,
    });

    const auth: AuthResponse = await loginResponse.json();

    const response = await request.get(`${env.baseUrl}/teams`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    expect(response.status()).toBe(200);
  });

  test("should reject request without token", async ({ request }) => {
    const response = await request.get(`${env.baseUrl}/teams`);

    expect(response.status()).toBe(401);
  });

  test("should reject malformed token", async ({ request }) => {
    const response = await request.get(`${env.baseUrl}/teams`, {
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    expect(response.status()).toBe(401);
  });
});
