import "@/app/globals.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import "prism-themes/themes/prism-z-touch.css";

export const metadata: Metadata = {
  title: "Pyodide-LLM Test Website",
  description: "A small website to test Pyodide with an LLM on Vercel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased">{children}</body>
    </html>
  );
}
