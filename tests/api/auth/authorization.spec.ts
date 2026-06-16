import { test, expect } from "@playwright/test";

import { AuthClient } from "../../../src/api/AuthClient";
import { AuthResponse } from "../../../src/models/auth/AuthResponse";

test.describe("Authorization - RBAC", () => {
  let authClient: AuthClient;

  test.beforeEach(async ({ request }) => {
    authClient = new AuthClient(request);
  });

  test("should reject unauthenticated requests", async ({ request }) => {
    const response = await request.get("http://localhost:8080/api/users");

    expect(response.status()).toBe(401);
  });

  test("should reject malformed token", async ({ request }) => {
    const response = await request.get("http://localhost:8080/api/users", {
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    expect(response.status()).toBe(401);
  });

  test("USER should not access users endpoint", async ({ request }) => {
    const loginResponse = await authClient.login({
      email: "user@test.com",
      password: "Password123!",
    });

    const auth: AuthResponse = await loginResponse.json();

    const response = await request.get("http://localhost:8080/api/users", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    expect(response.status()).toBe(403);
  });

  test("ADMIN should access users endpoint", async ({ request }) => {
    const loginResponse = await authClient.login({
      email: "admin@test.com",
      password: "Password123!",
    });

    const auth: AuthResponse = await loginResponse.json();

    const response = await request.get("http://localhost:8080/api/users", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    expect(response.status()).toBe(200);
  });

  test("SUPER_ADMIN should create user", async ({ request }) => {
    const loginResponse = await authClient.login({
      email: "superadmin@test.com",
      password: "Password123!",
    });

    const auth: AuthResponse = await loginResponse.json();

    const response = await request.post("http://localhost:8080/api/users", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },

      data: {
        firstName: "Test",
        lastName: "User",
        email: `user-${Date.now()}@test.com`,
        password: "Password123!",
      },
    });

    expect(response.status()).toBe(201);
  });

  test("ADMIN should not create super admin", async ({ request }) => {
    const loginResponse = await authClient.login({
      email: "admin@test.com",
      password: "Password123!",
    });

    const auth: AuthResponse = await loginResponse.json();

    const response = await request.post("http://localhost:8080/api/users", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },

      data: {
        email: `user-${Date.now()}@test.com`,
        role: "SUPER_ADMIN",
      },
    });

    expect(response.status()).toBe(403);
  });
});
