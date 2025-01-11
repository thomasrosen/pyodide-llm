import path from "path";
import { runChildProcess } from "./runChildProcess";

export async function runPythonCode({
  code,
}: {
  code: string;
}): Promise<unknown> {
  // Run the child process and await the result
  const scriptPath = path.resolve("src/scripts/call_pyodide.mjs");
  return await runChildProcess(scriptPath, { code });
}
