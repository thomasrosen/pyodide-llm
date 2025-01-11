import { NextRequest } from "next/server";
import { streamAnswer } from "./streamAnswer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");

    if (!q) {
      return new Response(JSON.stringify({ error: "No query provided" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const answer = await streamAnswer({
      q,
      reportStatus: (s) => {
        console.log(s);
      },
    });

    return new Response(answer, {
      headers: {
        "Content-Type": "text/plain charset=UTF-8",
      },
    });

    // // Return the result as a JSON response
    // return new Response(JSON.stringify({ answer }), {
    //   headers: { "Content-Type": "application/json" },
    // });
  } catch (error) {
    const errorStr = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorStr }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
