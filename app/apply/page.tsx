import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/section-header";
import { ApplyForm } from "@/components/site/apply-form";

export const metadata: Metadata = {
  title: "Apply — SYNTEZIS INCUBATOR",
  description: "Build with Syntezis. Submit your application to join the Berlin creative-tech incubator.",
};

export default function ApplyPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-36 md:px-10 md:pb-16 md:pt-44">
        <SectionHeader
          eyebrow="Build With Syntezis"
          title={<>Apply to Syntezis.</>}
          description="Five short steps. Tell us who you are, what you want to build, and why the Berlin studio floor is the right place to build it."
        />
      </section>
      <section className="mx-auto max-w-3xl px-5 pb-24 md:px-10 md:pb-36">
        <div className="rounded-[32px] border border-ink/10 bg-paper p-6 md:p-12">
          <ApplyForm />
        </div>
      </section>
    </>
  );
}
