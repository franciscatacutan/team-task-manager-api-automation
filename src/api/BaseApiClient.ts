import { APIRequestContext, APIResponse } from "@playwright/test";
import { env } from "../config/env";

interface RequestOptions {
  data?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

/**
 * BaseApiClient — foundation for all API resource clients.
 *
 * Responsibilities:
 *  - Owns the APIRequestContext (Playwright's HTTP engine)
 *  - Prepends baseUrl to every endpoint so subclients use relative paths only
 *  - Injects Content-Type and Authorization on every request
 *  - Exposes withToken() for a clean, immutable token-scoped instance
 *
 * Subclients extend this and only define resource-specific methods.
 * They never touch headers or construct full URLs directly.
 */
export class BaseApiClient {
  protected readonly request: APIRequestContext;
  protected readonly baseUrl: string;
  private readonly token: string;

  constructor(
    request: APIRequestContext,
    baseUrl: string = "",
    token: string = "",
  ) {
    this.request = request;
    this.baseUrl = baseUrl.replace(/\/$/, ""); // strip trailing slash defensively
    this.token = token;
  }

  /**
   * Returns a new client instance that injects a Bearer token on every request.
   * Immutable — the original instance is unchanged.
   *
   * Usage:
   *   const authed = client.withToken(token);
   *   await authed.get("/users");
   */
  withToken(token: string): this {
    return new (this.constructor as new (
      request: APIRequestContext,
      baseUrl: string,
      token: string,
    ) => this)(this.request, this.baseUrl, token);
  }

  /**
   * Builds the default headers for every request.
   * Subclients can override to add resource-specific headers.
   */
  protected defaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Merges caller-supplied headers on top of the defaults.
   * Caller headers win on conflicts (useful for overriding Content-Type for multipart, etc.)
   */
  private mergedHeaders(
    extra?: Record<string, string>,
  ): Record<string, string> {
    return { ...this.defaultHeaders(), ...extra };
  }

  protected logRequest(
    method: string,
    endpoint: string,
    options: RequestOptions = {},
  ): void {
    if (!env.debugRequest) return;

    const headers = this.mergedHeaders(options.headers);

    console.log("\n──── OUTGOING REQUEST ────────────────");
    console.log("METHOD :", method.toUpperCase());
    console.log("URL    :", this.url(endpoint));
    console.log("HEADERS:", JSON.stringify(headers, null, 2));
    if (options.data) {
      console.log("BODY   :", JSON.stringify(options.data, null, 2));
    }
    console.log("──────────────────────────────────────\n");
  }

  // ─── HTTP Methods ────────────────────────────────────────────────────────────

  protected async get(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<APIResponse> {
    this.logRequest("GET", endpoint, options);
    return this.request.get(this.url(endpoint), {
      headers: this.mergedHeaders(options.headers),
      params: options.params,
    });
  }

  protected async post(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<APIResponse> {
    this.logRequest("POST", endpoint, options);
    return this.request.post(this.url(endpoint), {
      data: options.data,
      headers: this.mergedHeaders(options.headers),
      params: options.params,
    });
  }

  protected async put(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<APIResponse> {
    this.logRequest("PUT", endpoint, options);

    return this.request.put(this.url(endpoint), {
      data: options.data,
      headers: this.mergedHeaders(options.headers),
      params: options.params,
    });
  }

  protected async patch(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<APIResponse> {
    this.logRequest("PATCH", endpoint, options);

    return this.request.patch(this.url(endpoint), {
      data: options.data,
      headers: this.mergedHeaders(options.headers),
      params: options.params,
    });
  }

  protected async delete(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<APIResponse> {
    this.logRequest("DELETE", endpoint, options);

    return this.request.delete(this.url(endpoint), {
      data: options.data,
      headers: this.mergedHeaders(options.headers),
      params: options.params,
    });
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  private url(endpoint: string): string {
    // Ensure exactly one slash between baseUrl and endpoint
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${path}`;
  }
}
