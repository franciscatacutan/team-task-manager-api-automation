import { APIRequestContext, APIResponse } from "@playwright/test";

export class BaseApiClient {
  protected request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  protected async get(endpoint: string): Promise<APIResponse> {
    return await this.request.get(endpoint);
  }

  protected async post(endpoint: string, data?: unknown): Promise<APIResponse> {
    return await this.request.post(endpoint, {
      data,
    });
  }

  protected async put(endpoint: string, data?: unknown): Promise<APIResponse> {
    return await this.request.put(endpoint, {
      data,
    });
  }

  protected async patch(
    endpoint: string,
    data?: unknown,
  ): Promise<APIResponse> {
    return await this.request.patch(endpoint, {
      data,
    });
  }

  protected async delete(endpoint: string): Promise<APIResponse> {
    return await this.request.delete(endpoint);
  }
}
