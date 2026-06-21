import { APIRequestContext } from "@playwright/test";
import { env } from "../config/env";

interface CreatedUser {
  userId: string;
  email: string;
  token: string;
}

/**
 * UserFactory — creates and cleans up throwaway users for tests
 * that need to mutate state (role changes, deletions, updates).
 *
 * Pattern:
 *   1. beforeEach  → create a fresh user
 *   2. test        → mutate it freely
 *   3. afterEach   → delete it (cleanup runs even if the test fails)
 *
 * This guarantees tests never share mutable state with each other.
 */
export class UserFactory {
  private static counter = 0;

  /**
   * Creates a throwaway user via POST /api/auth/register.
   * Returns the userId, email, and a valid token for that user.
   * Each call gets a unique email — safe for parallel workers.
   */
  static async createUser(request: APIRequestContext): Promise<CreatedUser> {
    const id = `${Date.now()}-${++this.counter}-${Math.random().toString(36).slice(2, 6)}`;
    const email = `throwaway+${id}@example.com`;
    const password = "TestPass123!";

    const registerRes = await request.post(
      `${env.apiBaseUrl}/api/auth/register`,
      {
        data: {
          email,
          password,
          confirmPassword: password,
          firstName: "Test",
          lastName: "User",
        },
        headers: { "Content-Type": "application/json" },
      },
    );

    if (registerRes.status() !== 201) {
      throw new Error(
        `[UserFactory] Failed to create user. HTTP ${registerRes.status()}. ` +
          `Body: ${await registerRes.text()}`,
      );
    }

    const registerBody = await registerRes.json();
    const userId: string = registerBody.user.userId;

    // Log in to get a token for this user
    const loginRes = await request.post(`${env.apiBaseUrl}/api/auth/login`, {
      data: { email, password },
      headers: { "Content-Type": "application/json" },
    });

    if (loginRes.status() !== 200) {
      throw new Error(
        `[UserFactory] Created user but login failed. HTTP ${loginRes.status()}`,
      );
    }

    const loginBody = await loginRes.json();

    return { userId, email, token: loginBody.token as string };
  }

  /**
   * Deletes a throwaway user via SUPER_ADMIN token.
   * Call in afterEach — runs even when the test fails so the DB stays clean.
   */
  static async deleteUser(
    userId: string,
    request: APIRequestContext,
    superAdminToken: string,
  ): Promise<void> {
    await request.delete(`${env.apiBaseUrl}/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        "Content-Type": "application/json",
      },
    });
    // Intentionally not asserting status — if the test already deleted
    // the user (e.g. a deletion test), cleanup should not throw.
  }
}
