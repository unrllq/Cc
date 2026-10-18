const ROW_A = ["TypeScript", "React", "Next.js", "Node.js", "Go", "PostgreSQL", "GraphQL", "Redis", "Python", "Rust"];
const ROW_B = ["Swift", "Kotlin", "React Native", "Flutter", "AWS", "Docker", "Kubernetes", "Terraform", "Figma", "Shopify"];
const CAPS = ["cap-plain", "cap-rose", "cap-plain", "cap-blue", "cap-plain", "cap-green", "cap-plain", "cap-amber"];

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-wrap overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <ul className={`marquee flex w-max gap-5 ${reverse ? "marquee-rev" : ""}`}>
        {doubled.map((t, i) => (
          <li key={i} aria-hidden={i >= items.length} className={`keycap is-pressable ${CAPS[i % CAPS.length]} h-16 px-7 pb-1 text-sm whitespace-nowrap normal-case`}>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Stack() {
  return (
    <section aria-label="Technologien" className="py-16">
      <p className="mb-6 text-center font-mono text-xs font-bold tracking-[0.2em] text-muted uppercase">
        Unser Werkzeugkasten
      </p>
      <div className="flex flex-col gap-3">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
    </section>
  );
}
