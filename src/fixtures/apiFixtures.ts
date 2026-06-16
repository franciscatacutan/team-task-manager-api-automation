import { test as base, APIRequestContext } from "@playwright/test";
import { AuthClient } from "../api/AuthClient";

/**
 * Typed fixture bag — extend this as you add more API clients.
 * Each test gets freshly scoped instances; no bleed between tests.
 */
type ApiFixtures = {
  authClient: AuthClient;
};

export const test = base.extend<ApiFixtures>({
  /**
   * Scoped to "test" by default — a new AuthClient per test.
   * Promotes full test isolation without manual beforeEach wiring.
   */
  authClient: async (
    { request }: { request: APIRequestContext },
    use: (client: AuthClient) => Promise<void>,
  ) => {
    const client = new AuthClient(request);
    await use(client);
    // Teardown hook — add token revocation or session cleanup here if needed.
  },
});

export { expect } from "@playwright/test";
