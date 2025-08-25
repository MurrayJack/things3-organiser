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
