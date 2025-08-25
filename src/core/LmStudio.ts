export const serviceCall = async (prompt: string): Promise<any> => {
  const response = await fetch("http://127.0.0.1:12345/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "microsoft/phi-4",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
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
