import { APIRequestContext } from "@playwright/test";
import { AuthClient } from "../api/AuthClient";
import { AuthResponse } from "../models/auth/AuthResponse";
import { env } from "../config/env";

export class AuthService {
  static async login(request: APIRequestContext): Promise<AuthResponse> {
    const authClient = new AuthClient(request);

    const response = await authClient.login({
      email: env.testEmail,
      password: env.testPassword,
    });

    return await response.json();
  }
}
