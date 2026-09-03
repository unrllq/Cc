"use client";

import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function FieldShell({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label-mono text-ink/50">
        {label}
        {required && <span className="text-signal"> *</span>}
      </span>
      {children}
    </label>
  );
}

const controlClass =
  "w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

export function Input({
  label,
  required,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <FieldShell label={label} required={required}>
      <input required={required} className={cn(controlClass, className)} {...props} />
    </FieldShell>
  );
}

export function Textarea({
  label,
  required,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; required?: boolean }) {
  return (
    <FieldShell label={label} required={required}>
      <textarea
        required={required}
        rows={4}
        className={cn(controlClass, "resize-none", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  required,
  className,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  options: string[];
}) {
  return (
    <FieldShell label={label} required={required}>
      <select required={required} className={cn(controlClass, "appearance-none", className)} {...props}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
