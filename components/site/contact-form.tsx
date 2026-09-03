"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { getCreator } from "@/lib/data";

const ROLES = ["Creator", "Brand", "Agency", "Investor", "Partner", "Media"];

export function ContactForm() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    const creatorSlug = searchParams.get("creator");
    const creator = creatorSlug ? getCreator(creatorSlug) : undefined;
    if (creator) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage(`Hi — I'd like to get in touch about a collaboration with ${creator.name}.`);
    }
  }, [searchParams]);

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-[32px] border border-ink/10 bg-paper px-8 py-20 text-center">
        <CheckCircle2 size={44} className="text-lime" />
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Message sent ✓</h2>
        <p className="max-w-sm text-ink/55">
          The Syntezis team typically replies within two business days.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
        push({ title: "Message sent ✓", description: "We'll be in touch shortly." });
      }}
      className="flex flex-col gap-6"
    >
      <Select label="I am a…" required options={ROLES} value={role} onChange={(e) => setRole(e.target.value)} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input label="Name" required placeholder="Full name" />
        <Input label="Company" placeholder="Optional" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Input label="Email" type="email" required placeholder="you@studio.com" />
        <Input label="Budget" placeholder="Optional — e.g. €5,000" />
      </div>
      <Input label="Project" placeholder="What's this about?" />
      <Textarea
        label="Message"
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell us more…"
      />
      <button
        type="submit"
        className="label-mono w-full rounded-full bg-ink py-4 text-off-white transition-colors hover:bg-dark sm:w-fit sm:px-8"
      >
        Start a Conversation →
      </button>
    </form>
  );
}
