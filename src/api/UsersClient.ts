import { APIResponse, APIRequestContext } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import { env } from "../config/env";
import { UserRole } from "../models/auth/UserRole";

/**
 * UsersClient — encapsulates all requests to the /users resource.
 *
 * Used in authorization tests to verify role-based access control
 * and resource ownership rules on user management endpoints.
 */
export class UsersClient extends BaseApiClient {
  constructor(
    request: APIRequestContext,
    baseUrl: string = env.apiBaseUrl,
    token: string = ""
  ) {
    super(request, baseUrl, token);
  }

  // ─── Super Admin only ────────────────────────────────────────────────────────

  /**
   * DELETE /api/users/:id
   * Hard-deletes a user account. SUPER_ADMIN only.
   */
  async deleteUser(userId: string): Promise<APIResponse> {
    return this.delete(`/api/users/${userId}`);
  }

  /**
   * PATCH /api/users/:id/role
   * Changes a user's role. SUPER_ADMIN only.
   */
  async updateUserRole(userId: string, role: UserRole): Promise<APIResponse> {
    return this.patch(`/api/admin/users/${userId}/role`, { data: { role } });
  }

  // ─── Admin+ ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/users
   * Returns a paginated list of all users. ADMIN+ only.
   */
  async listUsers(params?: {
    page?: number;
    limit?: number;
  }): Promise<APIResponse> {
    return this.get("/api/users", { params });
  }

  // ─── Own resource (any authenticated user) ───────────────────────────────────

  /**
   * GET /api/users/:id
   * Returns a single user profile.
   * Users may only fetch their own profile; ADMINs can fetch any.
   */
  async getUser(userId: string): Promise<APIResponse> {
    return this.get(`/api/users/${userId}`);
  }

  /**
   * PATCH /api/users/:id
   * Updates mutable profile fields.
   * Users may only update their own profile; ADMINs can update any.
   */
  async updateUser(
    userId: string,
    payload: UpdateUserRequest,
  ): Promise<APIResponse> {
    return this.patch(`/api/users/${userId}`, { data: payload });
  }

  /**
   * DELETE /api/users/:id/account
   * Self-service account deletion — removes the caller's own account.
   * Different from deleteUser: scoped to the authenticated user only.
   */
  async deleteOwnAccount(userId: string): Promise<APIResponse> {
    return this.delete(`/api/users/${userId}/account`);
  }
}
