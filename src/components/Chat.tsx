"use client";

import { fetchAndStreamUpdates } from "@/lib/fetchAndStreamUpdates";
import { useCallback, useRef, useState } from "react";

export function Chat() {
  const messagesRef = useRef<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const startChat = useCallback(async () => {
    const streamingObject = await fetchAndStreamUpdates(
      "/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: "was is 7 mal 3 ?" }),
      },
      {},
      () => {
        setMessages(JSON.parse(JSON.stringify(messagesRef.current)));
      }
    );

    console.log("streamingObject", streamingObject);
    messagesRef.current.push(streamingObject);
    setMessages(JSON.parse(JSON.stringify(messagesRef.current)));
  }, []);

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid black",
      }}
    >
      <h1>Chat</h1>
      <p>Chat with the AI</p>
      <button onClick={startChat}>Start Chat</button>

      {messages.map((msg, index) => {
        let latestestStatus: string | undefined = (msg.status || []).slice(
          -1
        )[0];
        if (latestestStatus === "done") {
          latestestStatus = undefined;
        }

        return (
          <div key={JSON.stringify(msg)}>
            {latestestStatus && (
              <p>
                <strong>{latestestStatus}</strong>
              </p>
            )}
            <p
              dangerouslySetInnerHTML={{
                __html: (msg.content || "").replaceAll("\n", "<br />"),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
