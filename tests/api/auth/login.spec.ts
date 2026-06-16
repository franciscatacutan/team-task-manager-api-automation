import { test, expect } from "../../../src/fixtures/apiFixtures";
import { UserRole } from "../../../src/models/auth/UserRole";
import { env } from "../../../src/config/env";
import {
  assertAuthResponse,
  assertErrorResponse,
} from "../../../src/utils/assertions";
import { LoginRequest } from "../../../src/models/auth/LoginRequests";

/**
 * Authentication - Login endpoint tests
 *
 * Covers: happy path, auth failures, input validation, and security edge cases.
 * All tests are independent — no shared mutable state between cases.
 */
test.describe("POST /auth/login", () => {
  // ─── Happy Path ────────────────────────────────────────────────────────────

  test.describe("Success cases", () => {
    test("returns a valid token for a super admin", async ({ authClient }) => {
      const response = await authClient.login({
        email: env.superAdminEmail,
        password: env.superAdminPassword,
      });

      expect(response.status()).toBe(200);

      const body = await assertAuthResponse(response);

      expect(body.user.email).toBe(env.superAdminEmail);
      expect(body.user.role).toBe(UserRole.SUPER_ADMIN);
    });

    test("returns a valid token for a regular user", async ({ authClient }) => {
      const response = await authClient.login({
        email: env.userEmail,
        password: env.userPassword,
      });

      expect(response.status()).toBe(200);

      const body = await assertAuthResponse(response);

      expect(body.user.email).toBe(env.userEmail);
      expect(body.user.role).toBe(UserRole.USER);
    });

    test("token meets minimum security length (>= 100 chars)", async ({
      authClient,
    }) => {
      const response = await authClient.login({
        email: env.superAdminEmail,
        password: env.superAdminPassword,
      });

      const body = await assertAuthResponse(response);

      expect(body.token.length).toBeGreaterThanOrEqual(100);
    });

    test("token expiry is a positive number of seconds", async ({
      authClient,
    }) => {
      const response = await authClient.login({
        email: env.superAdminEmail,
        password: env.superAdminPassword,
      });

      const body = await assertAuthResponse(response);

      expect(body.expiresInSeconds).toBeGreaterThan(0);
    });
  });

  // ─── Authentication Failures ────────────────────────────────────────────────

  test.describe("Authentication failures (401)", () => {
    test("rejects a valid email with wrong password", async ({
      authClient,
    }) => {
      const response = await authClient.login({
        email: env.userEmail,
        password: "WrongPassword123!",
      });

      expect(response.status()).toBe(401);

      const body = await assertErrorResponse(response);

      expect(body.status).toBe(401);
      expect(body.message).toBeTruthy();
    });

    test("rejects an unknown email", async ({ authClient }) => {
      const response = await authClient.login({
        email: "ghost-user@nonexistent.com",
        password: env.userPassword,
      });

      expect(response.status()).toBe(401);

      const body = await assertErrorResponse(response);

      expect(body.status).toBe(401);
      expect(body.message).toBeTruthy();
    });

    test("does not leak account existence (same error for wrong password vs unknown email)", async ({
      authClient,
    }) => {
      const [wrongPasswordRes, unknownEmailRes] = await Promise.all([
        authClient.login({
          email: env.userEmail,
          password: "WrongPassword123!",
        }),
        authClient.login({
          email: "ghost-user@nonexistent.com",
          password: env.userPassword,
        }),
      ]);

      expect(wrongPasswordRes.status()).toBe(401);
      expect(unknownEmailRes.status()).toBe(401);

      const [wrongPasswordBody, unknownEmailBody] = await Promise.all([
        assertErrorResponse(wrongPasswordRes),
        assertErrorResponse(unknownEmailRes),
      ]);

      // API must return the same generic message — no user enumeration
      expect(wrongPasswordBody.message).toBe(unknownEmailBody.message);
    });
  });

  // ─── Input Validation (400) ─────────────────────────────────────────────────

  test.describe("Input validation failures (400)", () => {
    const invalidPayloads: Array<{
      label: string;
      payload: Partial<LoginRequest>;
    }> = [
      {
        label: "empty email and password",
        payload: { email: "", password: "" },
      },
      { label: "missing email field", payload: { password: env.userPassword } },
      { label: "missing password field", payload: { email: env.userEmail } },
      {
        label: "malformed email (no @)",
        payload: { email: "invalid-email", password: env.userPassword },
      },
      {
        label: "malformed email (no TLD)",
        payload: { email: "user@nodomain", password: env.userPassword },
      },
      {
        label: "whitespace-only email",
        payload: { email: "   ", password: env.userPassword },
      },
      {
        label: "whitespace-only password",
        payload: { email: env.userEmail, password: "   " },
      },
      {
        label: "null email",
        payload: {
          email: null as unknown as string,
          password: env.userPassword,
        },
      },
    ];

    for (const { label, payload } of invalidPayloads) {
      test(`returns 400 for: ${label}`, async ({ authClient }) => {
        const response = await authClient.login(payload as LoginRequest);

        expect(response.status()).toBe(400);
      });
    }
  });

  // ─── Security Edge Cases ────────────────────────────────────────────────────

  test.describe("Security edge cases", () => {
    test("rejects SQL injection in email field", async ({ authClient }) => {
      const response = await authClient.login({
        email: "' OR 1=1; --",
        password: env.userPassword,
      });

      expect([400, 401]).toContain(response.status());
    });

    test("rejects script injection in email field", async ({ authClient }) => {
      const response = await authClient.login({
        email: "<script>alert(1)</script>@test.com",
        password: env.userPassword,
      });

      expect([400, 401]).toContain(response.status());
    });

    test("response does not expose sensitive fields", async ({
      authClient,
    }) => {
      const response = await authClient.login({
        email: env.superAdminEmail,
        password: env.superAdminPassword,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();

      expect(body).not.toHaveProperty("password");
      expect(body?.user).not.toHaveProperty("password");
      expect(body?.user).not.toHaveProperty("passwordHash");
    });

    test("response contains correct Content-Type header", async ({
      authClient,
    }) => {
      const response = await authClient.login({
        email: env.superAdminEmail,
        password: env.superAdminPassword,
      });

      expect(response.headers()["content-type"]).toContain("application/json");
    });
  });
});
