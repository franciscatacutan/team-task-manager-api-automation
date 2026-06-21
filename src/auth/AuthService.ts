import { APIRequestContext } from "@playwright/test";

import { AuthClient } from "../api/AuthClient";
import { AuthResponse } from "../models/auth/AuthResponse";
import { env } from "../config/env";

export class AuthService {
  static async loginAsUser(request: APIRequestContext): Promise<AuthResponse> {
    const authClient = new AuthClient(request);

    const response = await authClient.login({
      email: env.userEmail!,
      password: env.userPassword!,
    });

    return response.json();
  }

  static async loginAsAdmin(request: APIRequestContext): Promise<AuthResponse> {
    const authClient = new AuthClient(request);

    const response = await authClient.login({
      email: env.adminEmail!,
      password: env.adminPassword!,
    });

    return response.json();
  }

  static async loginAsSuperAdmin(
    request: APIRequestContext,
  ): Promise<AuthResponse> {
    const authClient = new AuthClient(request);

    const response = await authClient.login({
      email: env.superAdminEmail!,
      password: env.superAdminPassword!,
    });

    return response.json();
  }
}
