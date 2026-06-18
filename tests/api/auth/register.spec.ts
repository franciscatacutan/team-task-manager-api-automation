import { test, expect } from "../../../src/fixtures/apiFixtures";
import { UserRole } from "../../../src/models/auth/UserRole";
import { RegisterRequest } from "../../../src/models/auth/RegisterRequest";
import {
  assertRegisterResponse,
  assertErrorResponse,
} from "../../../src/utils/assertions";

function uniqueEmail(): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `test.user+${id}@example.com`;
}

const validPayload = (): RegisterRequest => ({
  email: uniqueEmail(),
  password: "SecurePass123!",
  confirmPassword: "SecurePass123!",
  firstName: "Jane",
  lastName: "Doe",
});

test.describe("POST /auth/register", () => {
  // ─── Happy Path ─────────────────────────────────────────────────────────────

  test.describe("Success cases", () => {
    test("creates a new user and returns 201 with correct shape", async ({
      authClient,
    }) => {
      const payload = validPayload();

      const response = await authClient.register(payload);

      const body = await assertRegisterResponse(response);

      expect(body.user.email).toBe(payload.email);
      expect(body.user.firstName).toBe(payload.firstName);
      expect(body.user.lastName).toBe(payload.lastName);
    });

    test("new user is assigned the default USER role", async ({
      authClient,
    }) => {
      const response = await authClient.register(validPayload());

      const body = await assertRegisterResponse(response);

      expect(body.user.role).toBe(UserRole.USER);
    });

    test("userId in response is a non-empty string", async ({ authClient }) => {
      const response = await authClient.register(validPayload());

      const body = await assertRegisterResponse(response);

      expect(body.user.userId.trim().length).toBeGreaterThan(0);
    });

    test("response contains correct Content-Type header", async ({
      authClient,
    }) => {
      const response = await authClient.register(validPayload());

      expect(response.status()).toBe(201);
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("email is stored in lowercase regardless of input casing", async ({
      authClient,
    }) => {
      const payload = validPayload();
      payload.email = payload.email.toUpperCase();

      const response = await authClient.register(payload);
      const body = await assertRegisterResponse(response);

      expect(body.user.email).toBe(payload.email.toLowerCase());
    });
  });

  // ─── Conflict ───────────────────────────────────────────────────────────────

  test.describe("Conflict (409)", () => {
    test("rejects registration with an already-registered email", async ({
      authClient,
    }) => {
      const payload = validPayload();

      // First registration — must succeed
      const first = await authClient.register(payload);
      expect(first.status()).toBe(201);

      // Second registration with the exact same email — must conflict
      const second = await authClient.register(payload);
      expect(second.status()).toBe(409);

      const body = await assertErrorResponse(second);

      expect(body.status).toBe(409);
      expect(body.message).toBeTruthy();
    });

    test("duplicate email check is case-insensitive", async ({
      authClient,
    }) => {
      const payload = validPayload();

      const first = await authClient.register(payload);
      expect(first.status()).toBe(201);

      const second = await authClient.register({
        ...payload,
        email: payload.email.toUpperCase(),
      });

      expect(second.status()).toBe(409);
    });
  });

  // ─── Password Rules ──────────────────────────────────────────────────────────

  test.describe("Password rules (400)", () => {
    test("rejects when password and confirmPassword do not match", async ({
      authClient,
    }) => {
      const response = await authClient.register({
        ...validPayload(),
        confirmPassword: "DifferentPass456!",
      });

      expect(response.status()).toBe(400);

      const body = await assertErrorResponse(response);
      expect(body.message).toBeTruthy();
    });

    const weakPasswords: Array<{ label: string; password: string }> = [
      { label: "too short (< 8 chars)", password: "Ab1!" },
      { label: "no uppercase letter", password: "securepass123!" },
      { label: "no lowercase letter", password: "SECUREPASS123!" },
      { label: "no digit", password: "SecurePass!!!" },
      { label: "no special character", password: "SecurePass123" },
      { label: "all whitespace", password: "        " },
    ];

    for (const { label, password } of weakPasswords) {
      test(`rejects weak password: ${label}`, async ({ authClient }) => {
        const response = await authClient.register({
          ...validPayload(),
          password,
          confirmPassword: password,
        });

        expect(response.status()).toBe(400);
      });
    }
  });

  // ─── Input Validation ────────────────────────────────────────────────────────

  test.describe("Input validation (400)", () => {
    const invalidPayloads: Array<{
      label: string;
      overrides: Partial<RegisterRequest>;
    }> = [
      { label: "missing email", overrides: { email: undefined } },
      { label: "empty email", overrides: { email: "" } },
      { label: "whitespace-only email", overrides: { email: "   " } },
      { label: "malformed email (no @)", overrides: { email: "invalidemail" } },
      {
        label: "malformed email (no TLD)",
        overrides: { email: "user@nodomain" },
      },
      { label: "missing password", overrides: { password: undefined } },
      { label: "empty password", overrides: { password: "" } },
      {
        label: "missing confirmPassword",
        overrides: { confirmPassword: undefined },
      },
      { label: "empty confirmPassword", overrides: { confirmPassword: "" } },
      { label: "missing firstName", overrides: { firstName: undefined } },
      { label: "empty firstName", overrides: { firstName: "" } },
      { label: "whitespace-only firstName", overrides: { firstName: "   " } },
      { label: "missing lastName", overrides: { lastName: undefined } },
      { label: "empty lastName", overrides: { lastName: "" } },
      { label: "whitespace-only lastName", overrides: { lastName: "   " } },
    ];

    for (const { label, overrides } of invalidPayloads) {
      test(`returns 400 for: ${label}`, async ({ authClient }) => {
        const payload = {
          ...validPayload(),
          ...overrides,
        } as Partial<RegisterRequest>;

        const response = await authClient.register(payload);

        expect(response.status()).toBe(400);
      });
    }

    test("returns 400 for a completely empty body", async ({ authClient }) => {
      const response = await authClient.register({});

      expect(response.status()).toBe(400);
    });
  });

  // ─── Security Edge Cases ─────────────────────────────────────────────────────

  test.describe("Security edge cases", () => {
    test("rejects SQL injection in email field", async ({ authClient }) => {
      const response = await authClient.register({
        ...validPayload(),
        email: "' OR 1=1; --@test.com",
      });

      expect([400, 409]).toContain(response.status());
    });

    test("rejects script injection in firstName", async ({ authClient }) => {
      const response = await authClient.register({
        ...validPayload(),
        firstName: "<script>alert(1)</script>",
      });

      // API should either reject (400) or sanitise and accept (201)
      expect([201, 400]).toContain(response.status());

      if (response.status() === 201) {
        const body = await response.json();
        // If accepted, the stored value must be sanitised — not raw HTML
        expect(body.user.firstName).not.toContain("<script>");
      }
    });

    test("response does not expose password or passwordHash", async ({
      authClient,
    }) => {
      const response = await authClient.register(validPayload());

      expect(response.status()).toBe(201);

      const body = await response.json();

      expect(body).not.toHaveProperty("password");
      expect(body).not.toHaveProperty("confirmPassword");
      expect(body?.user).not.toHaveProperty("password");
      expect(body?.user).not.toHaveProperty("passwordHash");
      expect(body?.user).not.toHaveProperty("confirmPassword");
    });

    test("two concurrent registrations with different emails both succeed", async ({
      authClient,
    }) => {
      const [res1, res2] = await Promise.all([
        authClient.register(validPayload()),
        authClient.register(validPayload()),
      ]);

      expect(res1.status()).toBe(201);
      expect(res2.status()).toBe(201);

      const [body1, body2] = await Promise.all([res1.json(), res2.json()]);

      // Each registration must produce a unique userId
      expect(body1.user.userId).not.toBe(body2.user.userId);
    });
  });

  // ─── Name Field Edge Cases ───────────────────────────────────────────────────

  test.describe("Name field edge cases", () => {
    test("accepts names with hyphens (e.g. Mary-Jane)", async ({
      authClient,
    }) => {
      const response = await authClient.register({
        ...validPayload(),
        firstName: "Mary-Jane",
        lastName: "O'Brien",
      });

      expect(response.status()).toBe(201);
    });

    test("accepts names with accented characters", async ({ authClient }) => {
      const response = await authClient.register({
        ...validPayload(),
        firstName: "Ángel",
        lastName: "García",
      });

      expect(response.status()).toBe(201);
    });

    test("trims leading/trailing whitespace from names", async ({
      authClient,
    }) => {
      const response = await authClient.register({
        ...validPayload(),
        firstName: "  Jane  ",
        lastName: "  Doe  ",
      });

      // API should either reject (400) or trim and store cleanly
      expect([201, 400]).toContain(response.status());

      if (response.status() === 201) {
        const body = await response.json();
        expect(body.user.firstName).toBe("Jane");
        expect(body.user.lastName).toBe("Doe");
      }
    });
  });
});
