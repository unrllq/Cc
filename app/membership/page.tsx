import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/section-header";
import { MembershipPlans } from "@/components/site/membership-plans";

export const metadata: Metadata = {
  title: "Membership — SYNTEZIS INCUBATOR",
  description: "Workspace access, production resources, community, events, mentorship and studio access.",
};

export default function MembershipPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="Membership"
          title={<>Choose your access level.</>}
          description="Every plan includes workspace access, community and events. Pro and Studio add production resources, mentorship and studio floor access."
        />
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <MembershipPlans />
      </section>
    </>
  );
}
