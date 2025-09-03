import { fetchPrompt } from "../core/langFuse";
import { serviceCall } from "../core/llm/LmStudio";
import { PromptFlowClient } from "../core/llm/promptFlow";
import {
  getInboxData,
  getThingsProjects,
  getThingsTags,
  updateTodoItem,
} from "../core/things3";

import dotenv from "dotenv";
dotenv.config();

(async () => {
  async function main() {
    // get the items from the inbox
    const todos = await getInboxData();

    if (!todos || todos.length === 0) {
      console.log("No TODO items found.");
      return;
    }

    // Get the list of projects from Things3
    const projects = await getThingsProjects();

    // get a full list of tags from Things3
    const tags = await getThingsTags();

    // loop through the inbox items
    for (const todo of todos) {
      console.log("Processing TODO item:", todo.name);

      const promptFlow = PromptFlowClient.fromEnvironment();

      const result = await promptFlow.invoke({
        todo,
        "todays-date": new Date().toISOString().split("T")[0],
        projects: projects.map((p) => p),
        tags: tags.map((t) => t),
      });

      const newTodo = JSON.parse(
        result.todo.replace("```json", "").replace("```", "").trim()
      );

      console.log(newTodo);

      // update the TODO item with the selected project and tags
      await updateTodoItem({
        ...todo,
        project: newTodo.project,
        notes: newTodo.notes,
        name: newTodo.name,
        dueDate: newTodo.dueDate,
      });
    }
  }

  await main();

  setInterval(async () => {
    // This function will be called every 10 minutes
    await main();
  }, 600000);
})();
