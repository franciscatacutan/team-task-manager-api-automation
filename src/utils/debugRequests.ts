import { APIResponse } from "@playwright/test";

export async function printResponse(response: APIResponse): Promise<void> {
  const body = await response.json().catch(() => null);

  console.log("─────────────────────────────────────");
  console.log("URL    :", response.url());
  console.log("STATUS :", response.status(), response.statusText());
  console.log("HEADERS:", JSON.stringify(response.headers(), null, 2));
  console.log("BODY   :", JSON.stringify(body, null, 2));
  console.log("─────────────────────────────────────");
}
