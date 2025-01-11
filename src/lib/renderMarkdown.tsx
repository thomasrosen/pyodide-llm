import { H1, H2, H3, H4, P } from "@/components/Typography";
import { cn } from "@/lib/utils";
import rehypePrism from "@mapbox/rehype-prism";
import Link from "next/link";
import { BlockMath } from "react-katex";
import * as prod from "react/jsx-runtime";
import rehypeKatex from "rehype-katex";
import rehypeReact from "rehype-react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const production = { Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs };

export function renderMarkdown(text: string) {
  const file = unified()
    .use(remarkParse, { fragment: true }) // Parse markdown.
    .use(remarkGfm) // Support GFM (tables, autolinks, tasklists, strikethrough).
    .use(remarkMath)
    // @ts-expect-error: the react types are missing.
    .use(remarkRehype) // Turn it into HTML.
    // @ts-expect-error: the types are not correct, but the package works. and the internet says it should work like it is used here.
    .use(rehypePrism, {
      ignoreMissing: true,
    })
    // @ts-expect-error: the types are not correct, but the package works. and the internet says it should work like it is used here.
    .use(rehypeKatex)
    .use(rehypeReact, {
      ...production,
      passNode: true,
      components: {
        h1: (props: any) => <H1 {...props} />,
        h2: (props: any) => <H2 {...props} />,
        h3: (props: any) => <H3 {...props} />,
        h4: (props: any) => <H4 {...props} />,
        h5: (props: any) => <H4 className="opacity-80" {...props} />,
        hr: (props: any) => (
          <hr
            className="my-8 h-[3px] rounded-[3px] border-0 bg-[currentColor] opacity-10"
            {...props}
          />
        ),
        a: (props: any) => {
          return (
            <Link
              className="underline decoration-primary decoration-2 underline-offset-2 hover:decoration-1"
              target="_blank"
              {...props}
            >
              {props.children}
            </Link>
          );
        },
        pre: (props: any) => {
          const { node } = props;
          const [child] = node.children;

          if (child.children.length === 1) {
            const subChild = child.children[0];
            console.log("subChild", subChild);

            if (subChild.type === "text" && subChild.value.startsWith("[")) {
              return (
                <BlockMath
                  {...props}
                  math={subChild.value.slice(1, subChild.value.length - 1)}
                />
              );
            }
          }

          return (
            <div className="group/code text-neutral relative mb-4 last:mb-0">
              <pre className="max-w-[calc(100vw-5rem)] overflow-auto whitespace-pre-wrap bg-black text-white">
                {props.children}
              </pre>
            </div>
          );
        },
        table: (props: any) => <table className="mb-4 w-full" {...props} />,
        p: (props: any) => {
          const { node } = props;
          const [child] = node.children;

          if (child.type === "text" && child.value.startsWith("[\n")) {
            return (
              <p className="mb-4 last-of-type:mb-0" {...props}>
                <BlockMath
                  math={child.value.slice(1, child.value.length - 1)}
                />
              </p>
            );
          }

          return <p className="mb-4 last-of-type:mb-0" {...props} />;
        },
        li: (props: any) => <li className="mb-4" {...props} />,
        ul: (props: any) => <ul className="ms-4 list-disc" {...props} />,
        ol: (props: any) => {
          const start = props.start || 1;
          const li_count =
            props.node.children.filter((node: any) => node.tagName === "li")
              .length - 1;
          const max_number = start + li_count;

          let margin_start_class = "";
          if (max_number > 10000) {
            margin_start_class = "ms-16";
          } else if (max_number > 1000) {
            margin_start_class = "ms-14";
          } else if (max_number > 100) {
            margin_start_class = "ms-12";
          } else if (max_number > 10) {
            margin_start_class = "ms-8";
          } else if (max_number > 0) {
            margin_start_class = "ms-5";
          }

          return (
            <ol className={cn("list-decimal", margin_start_class)} {...props} />
          );
        },
        blockquote: (props: any) => (
          <P
            className="relative mb-4 pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:rounded-full before:bg-primary before:content-['']"
            {...props}
          />
        ),
      },
    })
    .processSync(text);

  return file.result;
}
