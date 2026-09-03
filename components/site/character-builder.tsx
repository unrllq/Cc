"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/field";
import { generateAvatar } from "@/lib/avatar";
import { useToast } from "@/components/ui/toast";

const AGE_RANGES = ["18–22", "23–27", "28–34", "35+"];
const ARCHETYPES = ["Digital It-Girl", "The Director", "The Sculptor", "The Technician", "The Muse", "The Philosopher", "Other"];

interface CharacterResult {
  name: string;
  ageRange: string;
  personality: string;
  visualStyle: string;
  voice: string;
  interests: string;
  audience: string;
  archetype: string;
}

export function CharacterBuilder() {
  const [form, setForm] = useState<CharacterResult>({
    name: "",
    ageRange: "",
    personality: "",
    visualStyle: "",
    voice: "",
    interests: "",
    audience: "",
    archetype: "",
  });
  const [result, setResult] = useState<CharacterResult | null>(null);
  const { push } = useToast();

  const set = (field: keyof CharacterResult) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const valid = form.name && form.archetype && form.visualStyle && form.voice;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setResult(form);
          push({ title: "Character profile created ✓", description: form.name });
        }}
        className="grid gap-6 sm:grid-cols-2"
      >
        <Input label="Name" required value={form.name} onChange={set("name")} placeholder="e.g. Mia Nova" />
        <Select label="Age Range" options={AGE_RANGES} value={form.ageRange} onChange={set("ageRange")} />
        <Select label="Archetype" required options={ARCHETYPES} value={form.archetype} onChange={set("archetype")} />
        <Input label="Visual Style" required value={form.visualStyle} onChange={set("visualStyle")} placeholder="Fashion / Art / Berlin Culture" />
        <Input label="Voice" required value={form.voice} onChange={set("voice")} placeholder="Confident / Playful / Intelligent" />
        <Input label="Audience" value={form.audience} onChange={set("audience")} placeholder="e.g. 18–30, culture-forward" />
        <div className="sm:col-span-2">
          <Input label="Interests" value={form.interests} onChange={set("interests")} placeholder="Fashion, music, gaming…" />
        </div>
        <div className="sm:col-span-2">
          <Textarea label="Personality" value={form.personality} onChange={set("personality")} placeholder="A short description of who this character is." />
        </div>
        <button
          type="submit"
          disabled={!valid}
          className="label-mono flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-off-white transition-colors hover:bg-dark disabled:cursor-not-allowed disabled:opacity-30 sm:col-span-2"
        >
          <Sparkles size={14} /> Create Character Profile →
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {result ? (
          <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper">
            <img src={generateAvatar(result.name, 480, 360)} alt="" className="aspect-[4/3] w-full object-cover" />
            <div className="flex flex-col gap-3 p-6">
              <p className="text-2xl font-semibold tracking-tight">{result.name}</p>
              <p className="label-mono text-ink/40">{result.archetype.toUpperCase()}</p>
              <div className="flex flex-col gap-1.5 text-sm text-ink/65">
                <span>Style: {result.visualStyle}</span>
                <span>Voice: {result.voice}</span>
                {result.audience && <span>Audience: {result.audience}</span>}
                {result.ageRange && <span>Age range: {result.ageRange}</span>}
              </div>
              {result.personality && <p className="border-t border-ink/10 pt-3 text-sm text-ink/60">{result.personality}</p>}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-ink/20 p-8 text-center text-ink/45">
            <Sparkles size={22} />
            <p className="text-sm">Fill in the form to generate a character profile card.</p>
          </div>
        )}
      </div>
    </div>
  );
}
