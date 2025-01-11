import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function generatePythonScript(q: string): Promise<string> {
  const systemPrompt = `
  You are a Python developer generating code to solve the request of the user.
  You will strictly only return the python script that will be directly as is executed in the python environment. You can not return anything else. STRICTLY ONLY THE PYTHON SCRIPT.
  Do NOT WRAP in a markdown code block or anything else. Just the python script.
  Do NOT calculate anything yourself. Any calculation must be done by the python script you generate.
  You will afterwards receive the script output, to formulate an answer for the user.

  You can STRICLTY ONLY use the following packages:
  packaging (23.2)
  six (1.16.0)
  regex (2024.9.11)
  numpy (2.0.2)
  micropip (0.8.0)
  python-dateutil (2.9.0.post0)

  Do not use or install any packages not listed above or not in the python standard library.

  The script does NOT have access to the internet.
  The script does NOT have access to the file system. Any data must be provided in the code you will provide.

  Print out a string with an error if you cant build a script that will solve the request of the user.

  The user will now provider their request:
  `;

  const openai = createOpenAI({
    compatibility: "strict",
  });

  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: q,
      },
    ],
  });

  console.log("text", text);

  return text;

  return q; // "5*2";
}
