import { APIResponse } from "@playwright/test";
import { APIRequestContext } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import { LoginRequest } from "../models/auth/LoginRequest";
import { RegisterRequest } from "../models/auth/RegisterRequest";
import { env } from "../config/env";

/**
 * AuthClient — all requests to the /api/auth resource.
 *
 * Extends BaseApiClient so Content-Type, Accept, and Authorization
 * are injected automatically. Methods only define endpoint + payload.
 */
export class AuthClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request, env.apiBaseUrl);
  }

  /**
   * POST /api/auth/login
   * Returns the raw response — callers assert status and parse the body.
   */
  async login(payload: LoginRequest): Promise<APIResponse> {
    return this.post("/api/auth/login", { data: payload });
  }

  /**
   * POST /api/auth/register
   * Accepts Partial<> so validation tests can send intentionally incomplete payloads.
   */
  async register(
    payload: RegisterRequest | Partial<RegisterRequest>,
  ): Promise<APIResponse> {
    return this.post("/api/auth/register", { data: payload });
  }

  /**
   * POST /api/auth/refresh
   *
   * FIX: previously passed { headers: { Authorization } } as the data body — meaning
   * the token was sent as JSON, not as an HTTP header. withToken() now injects
   * Authorization: Bearer correctly into the request options.
   */
  async refreshToken(token: string): Promise<APIResponse> {
    return this.withToken(token).post("/api/auth/refresh");
  }

  /**
   * POST /api/auth/logout
   * Invalidates the current session. Requires a valid Bearer token.
   */
  async logout(token: string): Promise<APIResponse> {
    return this.withToken(token).post("/api/auth/logout");
  }
}
