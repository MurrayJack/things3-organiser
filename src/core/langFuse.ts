import { Langfuse } from "langfuse";

/**
 * Configuration for LangFuse client
 */
interface LangFuseConfig {
  secretKey: string;
  publicKey: string;
  baseUrl?: string;
}

/**
 * Creates a LangFuse client with the provided configuration
 * @param config LangFuse configuration
 * @returns LangFuse client instance
 */
function createLangFuseClient(config: LangFuseConfig): Langfuse {
  return new Langfuse({
    secretKey: config.secretKey,
    publicKey: config.publicKey,
    baseUrl: config.baseUrl || "https://cloud.langfuse.com",
  });
}

/**
 * Fetches a prompt from LangFuse
 * @param client LangFuse client instance
 * @param promptName Name of the prompt to fetch
 * @param version Optional version of the prompt (as number)
 * @returns The requested prompt or null if not found
 */
export async function getLangFusePrompt(
  client: Langfuse,
  promptName: string,
  version?: number
): Promise<any | null> {
  try {
    const prompt = await client.getPrompt(promptName, version);
    return prompt;
  } catch (error) {
    console.error(`Error fetching prompt ${promptName}:`, error);
    return null;
  }
}

/**
 * Initializes LangFuse with environment variables and returns a prompt
 * @param promptName Name of the prompt to fetch
 * @param version Optional version of the prompt (as number)
 * @returns The requested prompt or null if not found
 */
export async function fetchPrompt(
  promptName: string,
  version?: number
): Promise<any | null> {
  const config: LangFuseConfig = {
    secretKey: process.env.LANGFUSE_SECRET_KEY || "",
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || "",
    baseUrl: process.env.LANGFUSE_BASE_URL,
  };

  if (!config.secretKey || !config.publicKey) {
    console.error("LangFuse credentials not found in environment variables");
    return null;
  }

  const client = createLangFuseClient(config);
  return getLangFusePrompt(client, promptName, version);
}
