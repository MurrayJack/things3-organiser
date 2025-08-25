import type { InboxData } from "./things3";

export const serviceCall = async (prompt: string): Promise<any> => {
  const response = await fetch("http://localhost:12345/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }
  const json = await response.json();

  return {
    content: json.choices[0].message.content
      .replace("```json", "")
      .replace("```", ""),
  };
};

export const correctSpellingAndPunctuationPrompt = (todo: InboxData) => {
  return `
    You are a task management assistant. your job is to correct the spelling and punctuation in the following TODO json.

    # The TODO item is:
    ${JSON.stringify(todo, null, 2)}
  `;
};

export const buildAddNotesToTodoPrompt = (todo: InboxData) => {
  return `
    You are a task management assistant. your job is to add notes to the following TODO json.

    # The TODO item is:
    ${JSON.stringify(todo, null, 2)}
  `;
};

export const buildProjectSelectionPrompt = (
  todo: InboxData,
  projects: string[]
) => {
  return `
    You are a task management assistant. your job is to classify the following TODO json,
    into one of the following projects
   
    # The TODO item is:
    ${JSON.stringify(todo, null, 2)}

    # Available Projects:
    ${projects.map((p) => `- ${p}`).join("\n")}

    # Instructions:
    From the list of projects, select the most appropriate project for this task:

    # Output:
    Return the name of the project as a string, with no other text.
  `;
};
