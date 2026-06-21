function requireEnv(key: string): string {
  const value = process.env[key];

  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Required environment variable "${key}" is missing or empty.\n` +
        `Ensure it is set in your .env file or CI environment.`,
    );
  }

  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export const env = {
  apiBaseUrl: requireEnv("API_BASE_URL"),
  debugRequest: requireEnv("DEBUG_REQUESTS"),

  // ─── Super Admin ─────────────────────────────────────────────────────────────
  superAdminEmail: requireEnv("SUPER_ADMIN_EMAIL"),
  superAdminPassword: requireEnv("SUPER_ADMIN_PASSWORD"),
  superAdminId: requireEnv("SUPER_ADMIN_ID"),

  // ─── Admin ───────────────────────────────────────────────────────────────────
  adminEmail: requireEnv("ADMIN_EMAIL"),
  adminPassword: requireEnv("ADMIN_PASSWORD"),
  adminId: requireEnv("ADMIN_ID"),

  // ─── Regular User ─────────────────────────────────────────────────────────────
  userEmail: requireEnv("USER_EMAIL"),
  userPassword: requireEnv("USER_PASSWORD"),
  userId: requireEnv("USER_ID"),

  // ─── Second user for cross-user ownership tests ───────────────────────────────
  otherUserEmail: requireEnv("OTHER_USER_EMAIL"),
  otherUserPassword: requireEnv("OTHER_USER_PASSWORD"),
  otherUserId: requireEnv("OTHER_USER_ID"),

  // ─── Optional overrides ───────────────────────────────────────────────────────
  /** Minimum accepted token length — tighten per your JWT configuration */
  minTokenLength: parseInt(optionalEnv("MIN_TOKEN_LENGTH", "100"), 10),

  // ─── Token fixtures ────────────────────────────────────────────────────────
  /** A real expired JWT — generate one with a 1s TTL in your test environment */
  expiredToken: requireEnv("EXPIRED_TOKEN"),
} as const;

export type Env = typeof env;
