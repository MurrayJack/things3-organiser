import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getInboxData,
  getThingsTags,
  getThingsProjects,
  getTodaysData,
  updateTodoItem,
  getTodosByProject,
} from "../things3.js";
import { queryRAG, QdrantSearchResult } from "./rag.js";
import { search } from "duck-duck-scrape";

export const buildServer = () => {
  const server = new McpServer({
    name: "things3-organiser-server",
    version: "1.0.0",
  });

  // Things3 Tools
  server.registerTool(
    "get_things3_inbox",
    {
      title: "Get Things3 Inbox",
      description:
        "Retrieves all items from the Things3 inbox, this inbox are items that have not yet been processed",
      inputSchema: {},
    },
    async () => {
      try {
        const inboxData = await getInboxData();
        return {
          content: [
            {
              type: "text",
              text: `Found ${
                inboxData.length
              } items in Things3 inbox:\n\n${JSON.stringify(
                inboxData,
                null,
                2
              )}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving Things3 inbox data: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "get_things3_today",
    {
      title: "Get Things3 Today",
      description: "Retrieves all items from the Things3 today list",
      inputSchema: {},
    },
    async () => {
      try {
        console.log("Getting today's data...");
        const inboxData = await getTodaysData();
        console.log(`Retrieved ${inboxData.length} items from today's list`);

        // Limit response size to prevent context overflow
        const limitedData = inboxData.slice(0, 50); // Only first 50 items
        const responseText = `Found ${
          inboxData.length
        } items in Things3 today list (showing first ${
          limitedData.length
        }):\n\n${JSON.stringify(
          limitedData.map((e) => ({ name: e.name, id: e.id })),
          null,
          2
        )}`;

        console.log(`Response text length: ${responseText.length} characters`);

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      } catch (error) {
        console.error("Error in get_things3_today:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving Things3 today data: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "get_things3_tags",
    {
      title: "Get Things3 Tags",
      description: "Retrieves all available tags from Things3",
      inputSchema: {},
    },
    async () => {
      try {
        const tags = await getThingsTags();
        return {
          content: [
            {
              type: "text",
              text: `Available Things3 tags:\n${tags
                .map((tag) => `• ${tag}`)
                .join("\n")}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving Things3 tags: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "get_things3_projects",
    {
      title: "Get Things3 Projects",
      description: "Retrieves all available projects from Things3",
      inputSchema: {},
    },
    async () => {
      try {
        const projects = await getThingsProjects();
        return {
          content: [
            {
              type: "text",
              text: `Available Things3 projects:\n${projects
                .map((project) => `• ${project}`)
                .join("\n")}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving Things3 projects: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "update_things3_todo",
    {
      title: "Update Things3 Todo",
      description: "Updates a todo item in Things3",
      inputSchema: {
        id: z.string().describe("The ID of the todo item to update"),
        name: z.string().describe("The name/title of the todo item"),
        status: z.string().describe("The status of the todo item"),
        notes: z
          .string()
          .optional()
          .describe("Optional notes for the todo item"),
        tags: z
          .array(z.string())
          .describe("Array of tag names for the todo item"),
        project: z
          .string()
          .optional()
          .describe("Optional project name for the todo item"),
        dueDate: z
          .string()
          .optional()
          .describe("Optional due date for the todo item"),
      },
    },
    async ({ id, name, status, notes, tags, project, dueDate }) => {
      try {
        const todoData = {
          id,
          name,
          status,
          notes,
          tags,
          project,
          dueDate,
        };

        await updateTodoItem(todoData);
        return {
          content: [
            {
              type: "text",
              text: `Successfully updated Things3 todo item: ${name}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating Things3 todo: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "get_things3_todos_by_project",
    {
      title: "Get Things3 Todos by Project",
      description: "Retrieves all todos for a specific project from Things3",
      inputSchema: {
        project: z
          .string()
          .describe("The name of the project to retrieve todos for"),
      },
    },
    async ({ project }) => {
      try {
        const todos = await getTodosByProject(project);
        return {
          content: [
            {
              type: "text",
              text: `Todos for project "${project}":\n${todos
                .map((todo) => `• ${todo.name}`)
                .join("\n")}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving Things3 todos for project "${project}": ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // RAG Query Tool
  server.registerTool(
    "query_knowledge_base",
    {
      title: "Query Knowledge Base",
      description:
        "Search through your Obsidian markdown files using semantic similarity",
      inputSchema: {
        query: z
          .string()
          .describe("The search query to find relevant information"),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe("Maximum number of results to return (default: 5)"),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            "Optional array of tags to filter results by (e.g., ['obsidian', 'markdown'])"
          ),
      },
    },
    async ({ query, limit = 5, tags }) => {
      try {
        console.log(`RAG Query: "${query}" with limit ${limit}`);
        const results = await queryRAG(query, limit, tags);

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No results found for query: "${query}"`,
              },
            ],
          };
        }

        const formattedResults = results.map((result, index) => {
          const { score, payload } = result;
          const { source, full_path, text, chunk_index } = payload;

          return `**Result ${index + 1}** (Score: ${score.toFixed(4)})
📄 **Source:** ${source}
📁 **Path:** ${full_path}
📑 **Chunk:** ${chunk_index}
💬 **Content:** ${text.slice(0, 300)}${text.length > 300 ? "..." : ""}

---`;
        });

        return {
          content: [
            {
              type: "text",
              text: `Found ${
                results.length
              } relevant results for: "${query}"\n\n${formattedResults.join(
                "\n"
              )}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error in RAG query:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error querying knowledge base: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Web Search Tool
  server.registerTool(
    "web_search",
    {
      title: "Web Search",
      description:
        "Search the web using DuckDuckGo for current information and external sources",
      inputSchema: {
        query: z
          .string()
          .describe("The search query to find information on the web"),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe(
            "Maximum number of search results to return (default: 5, max: 10)"
          ),
        safe_search: z
          .enum(["strict", "moderate", "off"])
          .optional()
          .default("moderate")
          .describe("Safe search filter level (default: moderate)"),
      },
    },
    async ({ query, limit = 5, safe_search = "moderate" }) => {
      try {
        console.log(`Web Search: "${query}" with limit ${limit}`);

        // Ensure limit doesn't exceed 10
        const searchLimit = Math.min(limit, 10);

        const searchResults = await search(query, {
          safeSearch: safe_search as any, // Duck-duck-scrape SafeSearchType
        });

        if (!searchResults?.results || searchResults.results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No web search results found for query: "${query}"`,
              },
            ],
          };
        }

        // Take only the requested number of results
        const limitedResults = searchResults.results.slice(0, searchLimit);

        const formattedResults = limitedResults.map((result, index) => {
          const { title, description, url } = result;

          return `**Result ${index + 1}**
🔍 **Title:** ${title}
🔗 **URL:** ${url}
📝 **Description:** ${description || "No description available"}

---`;
        });

        return {
          content: [
            {
              type: "text",
              text: `Found ${
                limitedResults.length
              } web search results for: "${query}"\n\n${formattedResults.join(
                "\n"
              )}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error in web search:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error performing web search: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  return server;
};
