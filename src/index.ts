import {
  serviceCall,
  buildProjectSelectionPrompt,
  buildAddNotesToTodoPrompt,
  correctSpellingAndPunctuationPrompt,
} from "./LmStudio";
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
      const project = await serviceCall(
        buildProjectSelectionPrompt(todo, projects)
      );

      // add any notes
      // const notes = await serviceCall(buildAddNotesToTodoPrompt(todo));

      // correct spelling and punctuation
      // const corrected = await serviceCall(
      //   correctSpellingAndPunctuationPrompt(todo)
      // );

      // add any tags

      // update the TODO item with the selected project and tags
      await updateTodoItem({
        ...todo,
        project: project.content,
        // tags: tags,
        // notes: notes.content,
        // name: corrected.content,
      });
    }
  }

  await main();

  setInterval(async () => {
    // This function will be called every 10 minutes
    await main();
  }, 600000);
})();
