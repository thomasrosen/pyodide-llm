import { Chat } from "@/components/Chat";
import { H1, Lead } from "@/components/Typography";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default async function Home() {
  return (
    <main className="p-4 lg:p-8 w-[1000px] max-w-full mx-auto">
      <H1 className="mb-4">Pyodide-LLM Test Website</H1>
      <Lead className="mb-4">
        A small website to test{" "}
        <Link href="https://pyodide.org" target="_blank">
          Pyodide
        </Link>{" "}
        with an LLM on{" "}
        <Link href="https://vercel.com" target="_blank">
          Vercel
        </Link>
        .<br />
        Go here for the code:{" "}
        <Link href="https://github.com/thomasrosen/pyodide-llm" target="_blank">
          github.com/thomasrosen/pyodide-llm
        </Link>
      </Lead>
      <Separator className="mb-16" />

      <Chat />
    </main>
  );
}
