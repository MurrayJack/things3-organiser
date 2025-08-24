import { getInboxData, getThingsProjects, getThingsTags } from "./things3.ts";

(async () => {
  async function main() {
    // get the items from the inbox
    const inboxData = await getInboxData();
    console.log(inboxData);

    // Get the list of projects from Things3
    const projects = await getThingsProjects();
    console.log(projects);

    // get a full list of tags from Things3
    const tags = await getThingsTags();
    console.log(tags);

    // loop through the inbox items
    for (const item of inboxData) {
      console.log(`Processing item: ${item.name}`);

      // categories

      // add any notes

      // add any tags
    }
  }

  await main();

  //   setInterval(() => {
  //     // This function will be called after 1 second
  //     console.log("1 second has passed");
  //   }, 1000);
})();
