import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/section-header";
import { WorkspaceApp } from "@/components/site/workspace-app";
import { CREATORS, projectsByCreator } from "@/lib/data";

export const metadata: Metadata = {
  title: "Creator Workspace — SYNTEZIS INCUBATOR",
  description: "Demo creator workspace — projects, content calendar, analytics, character builder, application and bookings.",
};

export default function WorkspacePage() {
  const demoCreator = CREATORS[0];
  const projects = projectsByCreator(demoCreator.slug);

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-10 pt-32 md:px-10 md:pb-12 md:pt-40">
        <SectionHeader
          eyebrow="Creator Workspace"
          title={<>Your production, in one place.</>}
          description="A demo of the logged-in creator experience — project builder, content calendar, analytics, character builder, application status and bookings."
        />
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <WorkspaceApp creator={demoCreator} projects={projects} />
      </section>
    </>
  );
}
