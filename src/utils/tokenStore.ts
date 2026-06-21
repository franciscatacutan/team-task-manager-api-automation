import { APIRequestContext } from "@playwright/test";
import { UserRole } from "../models/auth/UserRole";
import { env } from "../config/env";

type Credentials = {
  email: string;
  password: string;
};

const ROLE_CREDENTIALS: Record<UserRole, Credentials> = {
  [UserRole.SUPER_ADMIN]: {
    email: env.superAdminEmail,
    password: env.superAdminPassword,
  },
  [UserRole.ADMIN]: { email: env.adminEmail, password: env.adminPassword },
  [UserRole.USER]: { email: env.userEmail, password: env.userPassword },
};

const roleCache = new Map<UserRole, string>();
const credentialCache = new Map<string, string>();

/**
 * TokenStore — acquires and caches Bearer tokens.
 *
 * Two acquisition paths:
 *   getToken()            — by role, using credentials from env
 *   getTokenForCredentials() — by arbitrary credentials (e.g. otherUser)
 *
 * Both caches are keyed so each unique identity logs in only once per worker.
 * Tokens survive for the lifetime of the worker process — if your API issues
 * short-lived tokens, call clearToken() or clearCache() between suites.
 */
export class TokenStore {
  /**
   * Returns a cached token for the given role.
   * Logs in using env credentials if no cached token exists.
   */
  static async getToken(
    role: UserRole,
    request: APIRequestContext,
  ): Promise<string> {
    if (roleCache.has(role)) return roleCache.get(role)!;

    const token = await TokenStore.login(ROLE_CREDENTIALS[role], request);
    roleCache.set(role, token);
    return token;
  }

  /**
   * Returns a cached token for arbitrary credentials.
   * Cache key is the email address — one login per unique user per worker.
   *
   * Use this for users that don't map to a named role in the env
   * (e.g. otherUser in resource-ownership tests).
   */
  static async getTokenForCredentials(
    credentials: Credentials,
    request: APIRequestContext,
  ): Promise<string> {
    const cacheKey = credentials.email;
    if (credentialCache.has(cacheKey)) return credentialCache.get(cacheKey)!;

    const token = await TokenStore.login(credentials, request);
    credentialCache.set(cacheKey, token);
    return token;
  }

  /** Clears all cached tokens */
  static clearCache(): void {
    roleCache.clear();
    credentialCache.clear();
  }

  /** Clears a single role's token — use after logout or token revocation */
  static clearToken(role: UserRole): void {
    roleCache.delete(role);
  }

  // ─── private ────────────────────────────────────────────────────────────────

  private static async login(
    credentials: Credentials,
    request: APIRequestContext,
  ): Promise<string> {
    const response = await request.post(`${env.apiBaseUrl}/api/auth/login`, {
      data: credentials,
      headers: { "Content-Type": "application/json" },
    });

    if (response.status() !== 200) {
      throw new Error(
        `[TokenStore] Login failed for "${credentials.email}". ` +
          `HTTP ${response.status()}. Check credentials in your .env file.`,
      );
    }

    const body = await response.json();

    if (!body?.token) {
      throw new Error(
        `[TokenStore] Login succeeded for "${credentials.email}" but ` +
          `response contained no token. Body: ${JSON.stringify(body)}`,
      );
    }

    return body.token as string;
  }
}
