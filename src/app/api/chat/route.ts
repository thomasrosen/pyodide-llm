import { NextRequest, NextResponse } from "next/server";
import { initDataEventStream } from "./initDataEventStream";
import { streamAnswer } from "./streamAnswer";

export const runtime = "nodejs"; // Ensure the route runs in a Node.js environment
export const dynamic = "force-dynamic"; // Prevent caching

export function POST(request: NextRequest) {
  const { readable, headers } = initDataEventStream(async ({ setData }) => {
    const body = await request.json();
    let q = body.q;

    if (!q) {
      throw new Error("Pls provide a query.");
    }

    q = `what is 4 + 2 ? pls also return the code`;

    const { textStream } = await streamAnswer({
      q,
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
