"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { fetchAndStreamUpdates } from "@/lib/fetchAndStreamUpdates";
import { renderMarkdown } from "@/lib/renderMarkdown";
import { cn } from "@/lib/utils";
import { Data } from "@/types";
import { useCallback, useRef, useState } from "react";

function FormatedMarkdown({ markdown }: { markdown?: string }) {
  if (markdown) {
    return renderMarkdown(markdown);
  }

  return null;
}

const initialMessages: Data[] = [];

export function Chat() {
  const messagesRef = useRef<Data[]>(initialMessages);
  const [messages, setMessages] = useState<Data[]>(initialMessages);
  const [input, setInput] = useState("");

  const updateMessages = useCallback(() => {
    setMessages(JSON.parse(JSON.stringify(messagesRef.current)));
  }, []);

  const startChat = useCallback(async () => {
    if (!input) {
      return;
    }

    messagesRef.current.push({
      role: "user",
      content: input,
      status: [],
    });
    setInput("");

    const streamingObject = await fetchAndStreamUpdates(
      "/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messagesRef.current }),
      },
      {},
      () => {
        updateMessages();
      }
    );

    messagesRef.current.push(streamingObject);
    updateMessages();
  }, [input, updateMessages]);

  return (
    <>
      <div className="flex flex-col gap-8 mb-16">
        {messages.map((msg, index) => {
          const status = msg.status || [];

          let latestestStatus: string | undefined = status.slice(-1)[0];
          if (latestestStatus === "done") {
            latestestStatus = undefined;
          }

          const isLoading = !msg.content && !status.includes("done");

          const role = msg.role || "user";

          return (
            <div
              key={`${index}_${JSON.stringify(msg)}`}
              className={cn(
                "flex flex-row",
                role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {role === "assistant" ? (
                <div className="flex flex-col gap-2 justify-start w-full">
                  <div>
                    {latestestStatus && <Badge>{latestestStatus}</Badge>}
                  </div>
                  <FormatedMarkdown markdown={msg.content || msg.preview} />
                </div>
              ) : null}

              {role === "user" ? (
                <Card
                  className={cn(
                    "max-w-3xl ms-16 w-fit py-2 px-4 rounded-lg",
                    isLoading && "animate-pulse"
                  )}
                >
                  <CardContent className="p-0 chat_bubble">
                    <FormatedMarkdown markdown={msg.content || msg.preview} />
                  </CardContent>
                </Card>
              ) : null}
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startChat();
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <Textarea
            onChange={(e) => {
              setInput(e.target.value);
            }}
            value={input}
            placeholder="Type your message here"
            className="w-full"
          />
          <Button type="submit">Send Message</Button>
        </div>
      </form>
    </>
  );
}
