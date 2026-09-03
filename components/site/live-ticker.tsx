import { Marquee } from "@/components/ui/marquee";

const SIGNALS = [
  "MIA NOVA JOINED SYNTEZIS",
  "NEW CREATOR FROM PARIS",
  "BERLIN STUDIO SESSION STARTED",
  "NEW BRAND BRIEF AVAILABLE",
  "24 CREATORS ACTIVE",
  "03 PROJECTS IN PRODUCTION",
  "COHORT 05 OPEN CALL LIVE",
  "AMSTERDAM MEETUP CONFIRMED",
];

export function LiveTicker() {
  return (
    <div className="border-y border-ink/10 bg-off-white">
      <Marquee items={SIGNALS} variant="light" direction="right" className="py-3" itemClassName="!text-sm !font-semibold tracking-normal text-ink/55" />
    </div>
  );
}
