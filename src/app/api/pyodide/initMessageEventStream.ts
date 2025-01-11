// app/api/stream/route.ts
import * as jsonpatch from "fast-json-patch";
import { applyReducer } from "fast-json-patch";

type Message = Record<string, unknown>;
type setMessagePropsReturn = Message | undefined | void;
type setMessageProps = (
  message: Message
) => setMessagePropsReturn | Promise<setMessagePropsReturn>;

type setMessagePropsOuter = (
  message: setMessageProps
) => setMessagePropsReturn | Promise<setMessagePropsReturn>;

export function initMessageEventStream(
  callback: (props: {
    setMessage: setMessagePropsOuter;
    closeStream: () => void;
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

  const data: { message: Message } = { message: {} };
  const message_observer = jsonpatch.observe<Object>(
    data.message,
    (patches) => {
      for (const patch of patches) {
        writer.write(encoder.encode(`data: ${JSON.stringify(patch)}\n\n`));
      }
    }
  );

  async function fireGenerate() {
    // always generate patch for the current message
    // this will automatically trigger the writer.write
    jsonpatch.generate(message_observer);
  }

  async function compareFullChange(newMessage?: Message) {
    if (!newMessage) {
      return;
    }

    // generate patch if a whole new message was returned
    const patch = jsonpatch.compare(data.message, newMessage);
    data.message = patch.reduce(applyReducer, data.message);
  }

  async function setMessage(fn: setMessageProps) {
    if (fn) {
      try {
        const newMessage = fn(data.message);
        if (newMessage instanceof Promise) {
          const resolvedNewMessage = await newMessage;
          await compareFullChange(resolvedNewMessage || undefined);
        } else {
          // could be that nothing was returned as the message can be mutated directly
          await compareFullChange(newMessage || undefined);
        }

        await fireGenerate();
      } catch (error) {
        console.error(error);
      }
    }
  }

  function closeStream() {
    jsonpatch.unobserve(data.message, message_observer);
    writer.close();
  }

  (async () => {
    try {
      await callback({ setMessage, closeStream, fireGenerate });
    } catch (error) {
      setMessage((message) => {
        message.error = error instanceof Error ? error.message : String(error);
      });
      closeStream();
    }
  })();

  return {
    readable: stream.readable,
    headers,
  };
}
