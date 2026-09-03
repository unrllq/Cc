"use client";

import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Reveal } from "@/components/ui/reveal";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Creator",
    price: "€49",
    period: "/ month",
    description: "For early-stage creators getting their first character off the ground.",
    features: ["Workspace access", "Community", "Monthly events", "Studio day pass (2 / mo)"],
  },
  {
    name: "Pro",
    price: "€149",
    period: "/ month",
    description: "Full production resources for creators actively shipping content.",
    features: ["Everything in Creator", "Production resources", "Studio access (unlimited)", "Mentorship", "Priority brand briefs"],
    featured: true,
  },
  {
    name: "Studio",
    price: "Custom",
    description: "For teams and agencies producing at scale inside Syntezis.",
    features: ["Everything in Pro", "Dedicated studio bay", "Team seats", "Custom production support", "Licensing support"],
  },
];

export function MembershipPlans() {
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { push } = useToast();

  const closeAndReset = () => {
    setCheckoutPlan(null);
    setTimeout(() => setConfirmed(false), 300);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.06}>
            <div
              className={cn(
                "flex h-full flex-col justify-between gap-8 rounded-3xl border p-7 md:p-8",
                p.featured ? "border-ink bg-ink text-off-white" : "border-ink/10 bg-paper"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold tracking-tight">{p.name}</p>
                  {p.featured && <span className="label-mono rounded-full bg-lime px-3 py-1 text-ink">Popular</span>}
                </div>
                <p className={cn("mt-6 text-4xl font-semibold tracking-tight", !p.featured && "text-ink")}>
                  {p.price}
                  {p.period && <span className={cn("text-base font-normal", p.featured ? "text-off-white/50" : "text-ink/40")}>{p.period}</span>}
                </p>
                <p className={cn("mt-3 text-sm", p.featured ? "text-off-white/60" : "text-ink/55")}>{p.description}</p>
              </div>
              <ul className="flex flex-col gap-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={15} className={p.featured ? "text-lime" : "text-ink/50"} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setCheckoutPlan(p)}
                className={cn(
                  "label-mono w-full rounded-full py-3.5 transition-all active:scale-[0.98]",
                  p.featured ? "bg-lime text-ink hover:brightness-95" : "bg-ink text-off-white hover:bg-dark"
                )}
              >
                {p.price === "Custom" ? "Talk to Us" : "Choose Plan"}
              </button>
            </div>
          </Reveal>
        ))}
      </div>

      <Dialog open={!!checkoutPlan} onClose={closeAndReset} labelledBy="checkout-title">
        {checkoutPlan && !confirmed && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmed(true);
              push({ title: "Membership activated ✓", description: `${checkoutPlan.name} plan — demo checkout, no payment taken.` });
            }}
          >
            <span className="label-mono text-ink/40">Demo Checkout</span>
            <h3 id="checkout-title" className="mt-3 text-2xl font-semibold tracking-tight">
              {checkoutPlan.name} — {checkoutPlan.price}
              {checkoutPlan.period}
            </h3>
            <p className="mt-3 text-sm text-ink/55">
              This is a demo flow — no real payment is processed and no card details are stored.
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <Input label="Email" type="email" required placeholder="you@studio.com" />
              <Input label="Card Number" required placeholder="4242 4242 4242 4242" inputMode="numeric" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Expiry" required placeholder="MM / YY" />
                <Input label="CVC" required placeholder="123" />
              </div>
            </div>
            <button
              type="submit"
              className="label-mono mt-8 w-full rounded-full bg-ink py-3.5 text-off-white transition-colors hover:bg-dark"
            >
              Confirm {checkoutPlan.price === "Custom" ? "Request" : "Membership"}
            </button>
          </form>
        )}
        {checkoutPlan && confirmed && (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <CheckCircle2 size={44} className="text-lime" />
            <h3 className="text-2xl font-semibold tracking-tight">Membership activated ✓</h3>
            <p className="max-w-sm text-sm text-ink/55">
              Welcome to the {checkoutPlan.name} plan. This was a demo checkout — no payment was taken.
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
