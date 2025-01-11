import { fork } from "child_process";

export type CallPyodideResult = {
  logs?: string;
  result?: unknown;
  error?: string;
};

export async function runChildProcess(
  scriptPath: string,
  payload: {
    code: string;
  }
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
