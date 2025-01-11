// const { loadPyodide } = require("pyodide");

// async function hello_python() {
//   let pyodide = await loadPyodide({
//     indexURL: "src/pyodide",
//   });
//   return pyodide.runPythonAsync("1+1");
// }

export default async function Home() {
  // const result = await hello_python();
  // console.log("Python says that 1+1 =", result);

  const result = 2;
  return (
    <div>
      <h1>Pyodide Test Website</h1>
      <p>A website to test pyodide on vercel.</p>
      <p>Python says that 1+1 = {result}</p>
    </div>
  );
}
