import * as jsonpatch from "fast-json-patch";
import { applyReducer } from "fast-json-patch";

type Data = Record<string, any>;
type setDataPropsReturn = Data | undefined | void;
type setDataProps = (
  data: Data
) => setDataPropsReturn | Promise<setDataPropsReturn>;

type setDataPropsOuter = (
  data: setDataProps
) => setDataPropsReturn | Promise<setDataPropsReturn>;

export function initDataEventStream(
  callback: (props: {
    setData: setDataPropsOuter;
    fireGenerate: () => void;
  }) => void
) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Set up headers for SSE
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  const wrapper: { data: Data } = { data: {} };
  const data_observer = jsonpatch.observe<Object>(wrapper.data, (patches) => {
    for (const patch of patches) {
      writer.write(encoder.encode(`data: ${JSON.stringify(patch)}\n\n`));
    }
  });

  async function fireGenerate() {
    // always generate patch for the current data
    // this will automatically trigger the writer.write
    jsonpatch.generate(data_observer);
  }

  async function compareFullChange(newData?: Data) {
    if (!newData) {
      return;
    }

    // generate patch if a whole new data was returned
    const patch = jsonpatch.compare(wrapper.data, newData);
    wrapper.data = patch.reduce(applyReducer, wrapper.data);
  }

  async function setData(fn: setDataProps) {
    if (fn) {
      try {
        const newData = fn(wrapper.data);
        if (newData instanceof Promise) {
          const resolvedNewData = await newData;
          await compareFullChange(resolvedNewData || undefined);
        } else {
          // could be that nothing was returned as the data can be mutated directly
          await compareFullChange(newData || undefined);
        }

        await fireGenerate();
      } catch (error) {
        console.error(error);
      }
    }
  }

  function closeStream() {
    jsonpatch.unobserve(wrapper.data, data_observer);
    writer.close();
  }

  (async () => {
    try {
      await callback({ setData, fireGenerate });
    } catch (error) {
      setData((data) => {
        data.error = error instanceof Error ? error.message : String(error);
      });
    } finally {
      // close the stream after the callback has been executed
      closeStream();
    }
  })();

  return {
    readable: stream.readable,
    headers,
  };
}
