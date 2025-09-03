export class PromptFlowClient {
  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async invoke<T = any, R = any>(inputs: T): Promise<R> {
    const requestHeaders = new Headers({ "Content-Type": "application/json" });
    requestHeaders.append("Authorization", "Bearer " + this.apiKey);

    return new Promise<R>((resolve, reject) => {
      fetch(this.endpoint, {
        method: "POST",
        body: JSON.stringify(inputs),
        headers: requestHeaders,
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error(
              "Request failed with status code" + response.status
            );
          }
        })
        .then((json) => {
          resolve(json);
        })
        .catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  }

  static fromEnvironment(): PromptFlowClient {
    const endpoint = process.env.PROMPT_FLOW_ENDPOINT;
    const apiKey = process.env.PROMPT_FLOW_API_KEY;

    if (!endpoint) {
      throw new Error("PROMPT_FLOW_ENDPOINT environment variable is not set");
    }

    if (!apiKey) {
      throw new Error("PROMPT_FLOW_API_KEY environment variable is not set");
    }

    return new PromptFlowClient(endpoint, apiKey);
  }
}
