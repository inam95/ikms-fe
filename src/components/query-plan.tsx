"use client";

import { LightbulbIcon, SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";
import { Task, TaskContent, TaskItem, TaskTrigger } from "@/components/ai-elements/task";
import { cn } from "@/lib/utils";

export type QueryPlanProps = ComponentProps<"div"> & {
  plan: string;
  subQuestions: string[];
  isStreaming?: boolean;
};

export const QueryPlan = ({
  plan,
  subQuestions,
  isStreaming = false,
  className,
  ...props
}: QueryPlanProps) => {
  const subQuestionCount = subQuestions.length;
  const questionLabel = subQuestionCount === 1 ? "sub-question" : "sub-questions";

  const planTitle = `Query Plan (${subQuestionCount.toString()} ${questionLabel})`;

  return (
    <div className={cn("not-prose mb-4", className)} {...props}>
      <Plan defaultOpen={true} isStreaming={isStreaming}>
        <PlanHeader>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <LightbulbIcon className="size-4 text-yellow-500" />
              <PlanTitle>{planTitle}</PlanTitle>
            </div>
            <PlanDescription>{plan}</PlanDescription>
          </div>
          <PlanAction>
            <PlanTrigger />
          </PlanAction>
        </PlanHeader>
        <PlanContent>
          <div className="space-y-2">
            {subQuestions.map((subQ, i) => (
              <Task key={i} defaultOpen={false}>
                <TaskTrigger title={`Sub-query ${i + 1}`}>
                  <div className="flex w-full cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <SearchIcon className="size-4" />
                    <p className="flex-1 text-left text-sm">Sub-query {i + 1}</p>
                  </div>
                </TaskTrigger>
                <TaskContent>
                  <TaskItem>{subQ}</TaskItem>
                </TaskContent>
              </Task>
            ))}
          </div>
        </PlanContent>
      </Plan>
    </div>
  );
};
