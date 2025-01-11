import { NextRequest, NextResponse } from "next/server";
import { initDataEventStream } from "./initDataEventStream";
import { streamAnswer } from "./streamAnswer";

export const runtime = "nodejs"; // Ensure the route runs in a Node.js environment
export const dynamic = "force-dynamic"; // Prevent caching

export function POST(request: NextRequest) {
  const { readable, headers } = initDataEventStream(async ({ setData }) => {
    const body = await request.json();
    const messages = body.messages;

    if (!messages || !messages.length) {
      throw new Error("Pls provide some messages.");
    }

    setData((data) => {
      data.role = "assistant";
    });

    const { textStream } = await streamAnswer({
      messages,
      setPreview: (newPreview) => {
        setData((data) => {
          if (!data.preview) {
            data.preview = "";
          }
          data.preview = newPreview;
        });
      },
      reportStatus: (newStatus) => {
        setData((data) => {
          if (!data.status) {
            data.status = [];
          }
          data.status.push(newStatus);
        });
      },
    });

    for await (const newContentPart of textStream) {
      setData((data) => {
        if (!data.content) {
          data.content = "";
        }
        data.content += newContentPart;
      });
    }
  });

  // Return the readable stream as the response
  return new NextResponse(readable, { headers });
}
