import { fetchPrompt, getLangFusePrompt } from "./core/langFuse";
import { serviceCall } from "./core/LmStudio";
import {
  getInboxData,
  getThingsProjects,
  getThingsTags,
  updateTodoItem,
} from "./things3";

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
      const prompt = await fetchPrompt("");

      if (!prompt) {
        console.error("Failed to fetch prompt");
        continue;
      }

      const project = await serviceCall(prompt);

      console.log(`Suggested project: ${project.content}`);

      // update the TODO item with the selected project and tags
      // await updateTodoItem({
      //   ...todo,
      //   project: project.content,
      //   // tags: tags,
      //   // notes: notes.content,
      //   // name: corrected.content,
      // });
    }
  }

  await main();

  setInterval(async () => {
    // This function will be called every 10 minutes
    await main();
  }, 600000);
})();
