import { exec } from "child_process";

export type InboxData = {
  id: string;
  name: string;
  status: string;
  notes?: string;
  tags: string[];
  dueDate?: string;
  project?: string;
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
                            project: project,
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
  return JSON.parse(response) as InboxData[];
};

export const getTodaysData = async (): Promise<InboxData[]> => {
  const getTodayListScript = `
                function buildJson() {
                    const app = Application('Things');
                    const inbox = app.lists.byName('Today');
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
                            project: project,
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

export function updateTodoItem(todo: InboxData): Promise<void> {
  const updateScript = `
                function updateTodo() {
                    const app = Application('Things');
                    const t = app.toDos.byId('${todo.id}');
                    if (t) {
                        t.name = "${todo.name}";
                        t.notes = ${todo.notes ? `"${todo.notes}"` : '""'};
                        
                        const projectName = ${
                          todo.project ? `"${todo.project}"` : "null"
                        };

                        if (projectName) {
                            const proj = app.projects.byName(projectName);
                            if (proj) {
                                t.project = proj;
                            }
                        }

                        
                        app.schedule(t, { for: new Date() });
                        return "Updated";
                    }
                    return "Not found";
                }
                updateTodo();
            `
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");

  return _executeScript(updateScript).then(() => {});
}

function _executeScript(script: string): Promise<string> {
  const osascript = `osascript -l JavaScript -e  "${script}"`;

  return new Promise((resolve, reject) => {
    const child = exec(osascript, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) {
        console.error("Error executing script:", err);
        reject(new Error(`AppleScript execution failed: ${err.message}`));
        return;
      }

      if (stderr) {
        console.error("AppleScript stderr:", stderr);
        reject(new Error(`AppleScript error: ${stderr}`));
        return;
      }

      resolve(stdout.trim());
    });

    // Handle timeout
    child.on("timeout", () => {
      console.error("AppleScript execution timed out");
      reject(new Error("AppleScript execution timed out after 10 seconds"));
    });
  });
}
