import { loadPyodide } from "./pyodide/pyodide.mjs";

process.on("message", async ({ code }) => {
  try {
    let stdout_logs = []

    // Check which packages should be made available to the Python code
    const availablePackages = ['micropip', "numpy", 'python-dateutil', 'regex']
    const packages = availablePackages.filter(pkg => code.includes(`import ${pkg}`));

    // Load Pyodide with the required packages
    const pyodide = await loadPyodide({
      indexURL: "./src/scripts/pyodide/",
      lockFileURL: './src/scripts/pyodide-lock.json',
      packageCacheDir: './src/scripts/pyodide-packages/',
      packages,
      fullStdLib: false,
      stdout: (msg) => stdout_logs.push(msg),
    });

    // Run Python code received from the parent
    const result = await pyodide.runPythonAsync(code || "");

    // Send the result back to the parent
    process.send({ stdout: stdout_logs.join('\n'), result });
  } catch (error) {
    process.send({ error: error.message });
  }
});
