import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getInboxData,
  getThingsTags,
  getThingsProjects,
  updateTodoItem,
} from "../things3.js";

export const buildServer = () => {
  const server = new McpServer({
    name: "example-server",
    version: "1.0.0",
  });

  // Things3 Tools
  server.registerTool(
    "get_things3_inbox",
    {
      title: "Get Things3 Inbox",
      description: "Retrieves all items from the Things3 inbox",
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

  return server;
};
