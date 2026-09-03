"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { CITIES } from "@/lib/data";

const DISCIPLINES = [
  "Virtual Creator",
  "AI Filmmaker",
  "Digital Character Design",
  "3D / Synthetic Media",
  "AI Music",
  "Fashion / Digital Editorial",
  "Motion & VFX",
  "Voice & Sound Design",
  "Other",
];

const STEPS = ["About You", "Your Project", "Your Experience", "Your Goals", "Submit"];

interface FormState {
  name: string;
  email: string;
  country: string;
  city: string;
  discipline: string;
  portfolio: string;
  idea: string;
  why: string;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  country: "",
  city: "",
  discipline: "",
  portfolio: "",
  idea: "",
  why: "",
};

export function ApplyForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("syntezis:application");
      if (raw) {
        const parsed = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed?.submitted) setSubmitted(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const stepValid = () => {
    if (step === 0) return form.name && form.email && form.country && form.city;
    if (step === 1) return form.discipline && form.idea;
    if (step === 2) return form.portfolio;
    if (step === 3) return form.why;
    return true;
  };

  const submit = () => {
    try {
      window.localStorage.setItem(
        "syntezis:application",
        JSON.stringify({ ...form, submitted: true, submittedAt: new Date().toISOString(), status: "Under Review" })
      );
    } catch {
      // ignore
    }
    setSubmitted(true);
    push({ title: "Application received ✓", description: "Status: Under Review" });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-[32px] border border-ink/10 bg-paper px-8 py-20 text-center">
        <CheckCircle2 size={48} className="text-lime" />
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Application received ✓</h2>
        <span className="label-mono rounded-full bg-ink px-4 py-2 text-off-white">STATUS: UNDER REVIEW</span>
        <p className="max-w-md text-ink/60">
          The SYNTEZIS admissions team reviews applications on a rolling basis. You&rsquo;ll hear from us within
          two to three weeks.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <span className="label-mono text-ink/40">
          {String(step + 1).padStart(2, "0")} / {STEPS[step].toUpperCase()}
        </span>
        <span className="label-mono text-ink/40">STEP {step + 1} OF {STEPS.length}</span>
      </div>
      <Progress value={((step + 1) / STEPS.length) * 100} className="mb-12" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {step === 0 && (
            <>
              <Input label="Name" required value={form.name} onChange={set("name")} placeholder="Full name" />
              <Input label="Email" type="email" required value={form.email} onChange={set("email")} placeholder="you@studio.com" />
              <Input label="Country" required value={form.country} onChange={set("country")} placeholder="e.g. Germany" />
              <Select label="City" required value={form.city} onChange={set("city")} options={CITIES.map((c) => c.name)} />
            </>
          )}
          {step === 1 && (
            <>
              <Select label="Discipline" required value={form.discipline} onChange={set("discipline")} options={DISCIPLINES} />
              <div className="sm:col-span-2">
                <Textarea label="Project Idea" required value={form.idea} onChange={set("idea")} placeholder="What are you looking to build?" />
              </div>
            </>
          )}
          {step === 2 && (
            <div className="sm:col-span-2">
              <Input label="Portfolio URL" required value={form.portfolio} onChange={set("portfolio")} placeholder="https://" />
            </div>
          )}
          {step === 3 && (
            <div className="sm:col-span-2">
              <Textarea label="Why Syntezis?" required value={form.why} onChange={set("why")} placeholder="Why do you want to build here?" />
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-col gap-3 rounded-2xl bg-ink/[0.04] p-6 sm:col-span-2">
              <Review label="Name" value={form.name} />
              <Review label="Email" value={form.email} />
              <Review label="Location" value={`${form.city}, ${form.country}`} />
              <Review label="Discipline" value={form.discipline} />
              <Review label="Portfolio" value={form.portfolio} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="label-mono flex items-center gap-2 text-ink/50 transition-colors hover:text-ink disabled:opacity-0"
        >
          <ArrowLeft size={14} /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!stepValid()}
            onClick={() => setStep((s) => s + 1)}
            className="label-mono flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-off-white transition-all hover:bg-dark disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continue <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="label-mono flex items-center gap-2 rounded-full bg-lime px-6 py-3.5 text-ink transition-all hover:brightness-95"
          >
            Submit Application <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/10 pb-2 last:border-0">
      <span className="label-mono text-ink/40">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}
