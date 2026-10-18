import type { Cap } from "@/lib/site";

export function SectionHead({
  cap,
  index,
  kicker,
  title,
  lead,
}: {
  cap: Cap;
  index: string;
  kicker: string;
  title: React.ReactNode;
  lead?: string;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className={`keycap cap-${cap} h-9 min-w-11 px-2 text-xs after:!bottom-[6px]`}>{index}</span>
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-muted uppercase">{kicker}</span>
        </div>
        <h2 className="mt-5 max-w-2xl text-[clamp(2rem,4.6vw,3.6rem)] leading-[1] font-bold tracking-[-0.035em] text-balance">
          {title}
        </h2>
      </div>
      {lead && <p className="max-w-sm text-muted text-pretty">{lead}</p>}
    </div>
  );
}
