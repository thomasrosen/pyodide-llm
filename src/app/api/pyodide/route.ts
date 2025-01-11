import { fork } from "child_process";
import { NextRequest } from "next/server";
import path from "path";

export type CallPyodideResult = {
  logs?: string;
  result?: unknown;
  error?: string;
};

async function runChildProcess(
  scriptPath: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve) => {
    const child = fork(scriptPath);

    // Listen for messages from the child process
    child.on("message", (message: CallPyodideResult) => {
      resolve(message);
    });

    // Listen for errors in the child process
    child.on("error", (error) => {
      resolve({ error: error }); // Reject the promise if the child process fails
    });

    // Handle child process exit
    child.on("exit", (code) => {
      if (code !== 0) {
        resolve({ error: new Error(`Child process exited with code ${code}`) });
      }
    });

    // Send payload to the child process
    child.send(payload);
  });
}

async function generatePythonScript(q: string): Promise<string> {
  // const systemPromptInfo = `
  // You can only use the the python standard library and the following packages:
  // packaging (23.2)
  // six (1.16.0)
  // regex (2024.9.11)
  // numpy (2.0.2)
  // micropip (0.8.0)
  // python-dateutil (2.9.0.post0)

  // Do not use or install any packages not listed above or not in the python standard library.

  // You can not import files. Everything must be done in the code block you will provide.
  // `;

  return q; // "5*2";
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");

    if (!q) {
      return new Response(JSON.stringify({ error: "No query provided" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const code = await generatePythonScript(q);

    // Run the child process and await the result
    const scriptPath = path.resolve("src/scripts/call_pyodide.mjs");
    const result = await runChildProcess(scriptPath, { code });

    // Return the result as a JSON response
    return new Response(JSON.stringify({ response: result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorStr = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorStr }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
