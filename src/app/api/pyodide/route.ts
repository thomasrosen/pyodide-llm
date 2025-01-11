// app/api/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initMessageEventStream } from "./initMessageEventStream";

export const runtime = "nodejs"; // Ensure the route runs in a Node.js environment
export const dynamic = "force-dynamic"; // Prevent caching

export function GET(request: NextRequest) {
  const { readable, headers } = initMessageEventStream(
    ({ setMessage, closeStream, fireGenerate }) => {
      try {
        const url = new URL(request.url);
        const q = url.searchParams.get("q");

        if (!q) {
          throw new Error("No query provided");
        }

        // Example: Send initial data
        setMessage((message) => {
          message.status = "started";
          return {
            ...message,
            random: Math.random(),
          };
        });

        (async () => {
          setTimeout(() => {
            setMessage((message) => {
              message.timeout = "finsihed";
              message.status = "done";
            });

            setTimeout(async () => {
              await setMessage(async (message) => {
                message.hello = "world";
                fireGenerate();

                // wait for 1 second
                await new Promise((resolve) => setTimeout(resolve, 1000));

                return {
                  removed: "everything",
                };
              });
              closeStream();
            }, 1000);
          }, 1000);
        })();
      } catch (error) {
        setMessage(() => ({
          error: error instanceof Error ? error.message : String(error),
        }));
        closeStream();
      }
    }
  );

  // Return the readable stream as the response
  return new NextResponse(readable, { headers });
}
