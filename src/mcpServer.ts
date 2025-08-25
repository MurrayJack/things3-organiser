import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// // Create the server
const server = new Server(
  {
    name: "mcp-sentry",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const getTodaysTodosTool = {
  name: "get_todays_todos",
  description: "Get today's todos from things3",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [getTodaysTodosTool],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_todays_todos":
      return {
        content: [
          {
            type: "text",
            text: `Today's todos`,
          },
        ],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("MCP Sentry server started");
