import { NextRequest } from "next/server";
import path from "path";
import { generatePythonScript } from "./generatePythonScript";
import { runChildProcess } from "./runChildProcess";

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
