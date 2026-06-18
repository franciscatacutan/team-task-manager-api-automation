import { test as base, APIRequestContext } from "@playwright/test";
import { AuthClient } from "../api/auth/AuthClient";

type ApiFixtures = {
  authClient: AuthClient;
};

export const test = base.extend<ApiFixtures>({
  authClient: async (
    { request }: { request: APIRequestContext },
    use: (client: AuthClient) => Promise<void>,
  ) => {
    const client = new AuthClient(request);
    await use(client);
  },
});

export { expect } from "@playwright/test";
