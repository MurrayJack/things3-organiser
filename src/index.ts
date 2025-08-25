import { fetchPrompt, getLangFusePrompt } from "./core/langFuse";
import { serviceCall } from "./core/LmStudio";
import {
  getInboxData,
  getThingsProjects,
  getThingsTags,
  updateTodoItem,
} from "./things3";

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

      // using LM Studio connect the item to a project
      const prompt = await fetchPrompt("review-todo-item");

      if (!prompt) {
        console.error("Failed to fetch prompt");
        continue;
      }

      const filledPrompt = prompt.prompt
        .replace("{{TODO}}", JSON.stringify(todo, undefined, 4))
        .replace(
          "{{PROJECTS}}",
          JSON.stringify(
            projects.map((p) => p),
            undefined,
            4
          )
        )
        .replace(
          "{{TAGS}}",
          JSON.stringify(
            tags.map((t) => t),
            undefined,
            4
          )
        );

      const project = await serviceCall(filledPrompt);
      const newTodo = JSON.parse(project.content);

      // update the TODO item with the selected project and tags
      await updateTodoItem({
        ...todo,
        project: newTodo.project,
        notes: newTodo.notes,
        name: newTodo.name,
      });
    }
  }

  await main();

  setInterval(async () => {
    // This function will be called every 10 minutes
    await main();
  }, 600000);
})();
