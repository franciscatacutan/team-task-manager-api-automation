import { APIResponse } from "@playwright/test";
import { BaseApiClient } from "../BaseApiClient";
import { LoginRequest } from "../../models/auth/LoginRequests";
import { RegisterRequest } from "../../models/auth/RegisterRequest";

export class AuthClient extends BaseApiClient {
  async login(payload: LoginRequest): Promise<APIResponse> {
    return this.post("/api/auth/login", payload);
  }

  async register(
    payload: RegisterRequest | Partial<RegisterRequest>,
  ): Promise<APIResponse> {
    return this.post("api/auth/register", payload);
  }

  async refreshToken(token: String): Promise<APIResponse> {
    return this.post("/auth/refresh", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
