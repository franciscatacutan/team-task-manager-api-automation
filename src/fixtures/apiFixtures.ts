import { test as base, APIRequestContext } from "@playwright/test";
import { AuthClient } from "../api/AuthClient";
import { UsersClient } from "../api/UsersClient";

type ApiFixtures = {
  authClient: AuthClient;
  usersClient: UsersClient;
};

export const test = base.extend<ApiFixtures>({
  authClient: async (
    { request }: { request: APIRequestContext },
    use: (client: AuthClient) => Promise<void>,
  ) => {
    await use(new AuthClient(request));
  },

  usersClient: async (
    { request }: { request: APIRequestContext },
    use: (client: UsersClient) => Promise<void>,
  ) => {
    await use(new UsersClient(request));
  },
});

export { expect } from "@playwright/test";
