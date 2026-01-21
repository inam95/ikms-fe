"use client";

import { ChevronDownIcon, FileTextIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type RAGContextProps = ComponentProps<"div"> & {
  context: string;
};

export const RAGContext = ({ context, className, ...props }: RAGContextProps) => {
  // Count the number of chunks in the context
  const chunkCount = (context.match(/Chunk \d+/g) || []).length;
  const displayCount = chunkCount > 0 ? ` (${chunkCount} chunks)` : "";

  return (
    <Collapsible defaultOpen={false} className={cn("not-prose mb-4", className)} {...props}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <FileTextIcon className="size-4" />
        <span className="flex-1 text-left">View Retrieved Context{displayCount}</span>
        <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "mt-3 max-h-96 overflow-y-auto rounded-lg bg-muted p-4 text-xs",
          "outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2"
        )}
      >
        <pre className="font-mono whitespace-pre-wrap text-muted-foreground">{context}</pre>
      </CollapsibleContent>
    </Collapsible>
  );
};
