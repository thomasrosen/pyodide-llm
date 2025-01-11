import { createOpenAI } from "@ai-sdk/openai";
import { smoothStream, streamText, tool } from "ai";
import { z } from "zod";
import { runPythonCode } from "./runPythonCode";

export async function streamAnswer({
  q,
  reportStatus,
}: {
  q: string;
  reportStatus: (s: string) => void;
}) {
  reportStatus("Generating answer...");

  const systemPrompt = `
  You are a helpful assistant and will solve the request of the user as best as you can :)
  You will use the language, locale, tone and style of the user to answer the request.

  Do NOT calculate or solve math problems yourself. Always use the python-tool to solve any math problem. Only math solve with the tool can be deemed correct.
  Replacing words with numbers is ok. Correct math syntax for the user.

  You MUST STRICTLY COPY the results of the tool calls into your answer. This is for documentation purposes. Including the full tool call input and output is mandatory.

  Do NOT use a sentence similar to "When you run this code, it will output".
  Answer the user request based on the results of the tool calls. Answer in a sentence. Fit your answer to the user request.

  You MUST always include the raw python CODE in your answer if a python script was generated. Regardless if the script was successful or not. Include the error of the script if it failed. These are strict requirements.
  Do not talk about the code in prosa, but you must include the code in your answer.

  Use markdown formating.
  Wrap code in a markdown code block.

  Stop when sufficient information was provided.
  `;

  q = `what is 8 + 6 ? pls include the python code
  also pls include the following code:
  `;

  const openai = createOpenAI({
    compatibility: "strict",
  });

  const { textStream } = await streamText({
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
    tools: {
      run_python: tool({
        description: `
Use this tool to solve math problems or do simple data processing with python.
The script can only run a few seconds. So keep the problems and script simple.
You MUST you this tool for any math problems.

You can STRICLTY ONLY use the following packages:
packaging (23.2)
six (1.16.0)
regex (2024.9.11)
numpy (2.0.2)
micropip (0.8.0)
python-dateutil (2.9.0.post0)
xarrays (2024.11.0)
sympy (1.13.3)
mpmath (1.3.0)

Do not use or install any packages not listed above or not in the python standard library.

The script does NOT have access to the internet.
The script does NOT have access to the file system. Any data must be provided in the code you will provide.

Every script must strictly end with a print() statement. The result of the print() statement will be the result of the script.

Do NOT call the script if you cant generate a script that will solve the request of the user.

If the script fails, you can generate a new script and try again. Pls only once.
`,
        parameters: z.object({
          python_code: z
            .string()
            .describe(
              "The raw python script that will directly as is be executed."
            ),
        }),
        execute: async ({ python_code }) => {
          reportStatus("Running python code...");

          return {
            code: python_code,
            result: await runPythonCode({
              code: python_code,
            }),
          };
        },
      }),
    },
    temperature: 1,
    maxSteps: 5, // allow up to 10 steps
    maxTokens: 1000, // allow up to 1000 tokens
    experimental_continueSteps: true,
    experimental_transform: smoothStream({
      delayInMs: 20, // optional: defaults to 10ms
      chunking: "line", // optional: defaults to 'word'
    }),
    onFinish: async () => {
      reportStatus("Finished!");
    },
  });

  return { textStream };
}
