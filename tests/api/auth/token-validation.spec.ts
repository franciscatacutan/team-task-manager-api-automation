import { test, expect } from "../../../src/fixtures/apiFixtures";
import { UsersClient } from "../../../src/api/UsersClient";
import { env } from "../../../src/config/env";
import { APIRequestContext } from "@playwright/test";

/**
 * Auth middleware — token validation
 *
 * Tests the auth middleware layer in isolation using one probe endpoint.
 * Probe: GET /api/users — any protected route would work equally well.
 *
 * Single responsibility:
 *   Prove that the middleware correctly rejects every category of bad token.
 *   These cases do NOT need to be repeated in users.spec.ts, teams.spec.ts,
 *   projects.spec.ts, or any other resource spec. Those specs only need one
 *   "endpoint is protected" check (missing token → 401) to confirm the
 *   middleware is wired up at all.
 *
 * If this suite passes, every other protected endpoint inherits that
 * guarantee — the middleware is the same code path for all of them.
 */

// ─── token fixtures ───────────────────────────────────────────────────────────

const TOKENS = {
  // structurally valid JWT but signature doesn't match the server's secret
  tampered:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
    ".eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IlNVUEVSX0FETUlOIn0" +
    ".INVALID_SIGNATURE_TAMPERED",

  // valid JWT structure, payload claims SUPER_ADMIN, but signature is forged
  forgedRole:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
    ".eyJzdWIiOiJmYWtlLXVzZXItaWQiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE2MDAwMDAwMDB9" +
    ".FORGED_SIGNATURE",
} as const;

// ─── probe helper ─────────────────────────────────────────────────────────────

/**
 * Fires the probe request with the given token.
 * Abstracts the endpoint so changing the probe is a one-line update.
 */
function probe(request: APIRequestContext, token?: string) {
  const client = new UsersClient(request);
  return token !== undefined
    ? client.withToken(token).listUsers()
    : client.listUsers();
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe("Auth middleware — token validation", () => {
  // ── Missing / empty ────────────────────────────────────────────────────────

  test("rejects request with no Authorization header", async ({ request }) => {
    const response = await probe(request);
    expect(response.status()).toBe(401);
  });

  test("rejects empty Bearer token", async ({ request }) => {
    const response = await probe(request, "");
    expect(response.status()).toBe(401);
  });

  // ── Malformed ──────────────────────────────────────────────────────────────

  test("rejects random string token", async ({ request }) => {
    const response = await probe(request, "not-a-token");
    expect(response.status()).toBe(401);
  });

  test("rejects single-segment string", async ({ request }) => {
    const response = await probe(request, "onlyone");
    expect(response.status()).toBe(401);
  });

  test("rejects two-segment JWT (missing signature)", async ({ request }) => {
    const response = await probe(
      request,
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ",
    );
    expect(response.status()).toBe(401);
  });

  // ── Tampered / forged ──────────────────────────────────────────────────────

  test("rejects well-formed JWT with invalid signature", async ({
    request,
  }) => {
    const response = await probe(request, TOKENS.tampered);
    expect(response.status()).toBe(401);
  });

  test("rejects JWT with forged role claim in payload", async ({ request }) => {
    const response = await probe(request, TOKENS.forgedRole);
    expect(response.status()).toBe(401);
  });

  // ── Expired ────────────────────────────────────────────────────────────────

  test("rejects expired token", async ({ request }) => {
    const response = await probe(request, env.expiredToken);
    expect(response.status()).toBe(401);
  });

  // ── Security ───────────────────────────────────────────────────────────────

  test("error body does not leak server internals", async ({ request }) => {
    const response = await probe(request, "bad.token.value");

    expect(response.status()).toBe(401);

    const body = await response.json();
    const raw = JSON.stringify(body).toLowerCase();

    // Must never reveal signing secret, algorithm, or stack trace
    expect(raw).not.toContain("secret");
    expect(raw).not.toContain("hs256");
    expect(raw).not.toContain("stacktrace");
    expect(raw).not.toContain("stack_trace");
    expect(raw).not.toContain("at com."); // Java stack trace
    expect(raw).not.toContain("at org."); // Java stack trace
  });

  test("response has correct Content-Type even for 401", async ({
    request,
  }) => {
    const response = await probe(request, "bad.token.value");

    expect(response.status()).toBe(401);
    expect(response.headers()["content-type"]).toContain("application/json");
  });
});
