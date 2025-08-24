import { exec } from "child_process";

export type InboxData = {
  id: string;
  name: string;
  status: string;
  notes?: string;
  tags: string[];
  dueDate?: string;
};

export const getInboxData = async (): Promise<InboxData[]> => {
  const getTodayListScript = `
                function buildJson() {
                    const app = Application('Things');
                    const inbox = app.lists.byName('Inbox');
                    const todos = inbox.toDos();
                    const json = todos.map(t => {
                        const area = t.area() ? t.area().name() : undefined;
                        const project = t.project() ? t.project().name() : undefined;
                        const tags = t.tags().map(tag => tag.name());
                        return {
                            id: t.id(),
                            name: t.name(),
                            status: t.status(),
                            notes: t.notes(),
                            tags: tags,
                            dueDate: t.dueDate() ? t.dueDate().toString() : undefined
                        };
                    });
                    return JSON.stringify(json);
                }
                buildJson();
            `
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");

  const response = await _executeScript(getTodayListScript);
  console.log("Response from Things3:", response);
  return JSON.parse(response) as InboxData[];
};

export function getThingsTags(): Promise<string[]> {
  const getTagsScript = `
                function buildJson() {
                    const app = Application('Things');
                    const tags = app.tags();
                    return JSON.stringify(tags.map(t => t.name()));
                }
                buildJson();
            `
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");

  return _executeScript(getTagsScript).then(
    (response) => JSON.parse(response) as string[]
  );
}

export function getThingsProjects(): Promise<string[]> {
  const getProjectsScript = `
                function buildJson() {
                    const app = Application('Things');
                    const projects = app.projects();
                    return JSON.stringify(projects.map(p => p.name()));
                }
                buildJson();
            `
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");

  return _executeScript(getProjectsScript).then(
    (response) => JSON.parse(response) as string[]
  );
}

function _executeScript(script: string): Promise<string> {
  const osascript = `osascript -l JavaScript -e  "${script}"`;

  return new Promise((resolve) => {
    exec(osascript, (err, stdout, stderr) => {
      if (err) {
        console.error("Error executing script:", err);
        resolve(err.message);
      }

      resolve(stdout);
    });
  });
}
