"use client";

import { Check } from "lucide-react";
import { useLocalSet } from "@/lib/use-local-set";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

export function ApplyProjectButton({ slug, name }: { slug: string; name: string }) {
  const { has, add, hydrated } = useLocalSet("syntezis:applied-opportunities");
  const { push } = useToast();
  const applied = hydrated && has(slug);

  return (
    <button
      type="button"
      onClick={() => {
        add(slug);
        push({ title: "Application sent ✓", description: name });
      }}
      className={cn(buttonVariants({ variant: applied ? "lime" : "primary", size: "lg" }), "w-full sm:w-auto")}
    >
      {applied ? (
        <>
          <Check size={16} /> Application Sent
        </>
      ) : (
        "Apply for Project →"
      )}
    </button>
  );
}
