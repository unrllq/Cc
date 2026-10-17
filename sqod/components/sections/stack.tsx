const ROW_A = ["SAP S/4HANA", "DATEV", "Microsoft 365", "Salesforce", "HubSpot", "Shopify", "Shopware", "Odoo", "Personio", "lexoffice"];
const ROW_B = ["Pipedrive", "JTL", "weclapp", "Xentral", "Stripe", "SevDesk", "Google Workspace", "Jira", "Power BI", "PostgreSQL"];

const FACTS = [
  { k: "DSGVO", v: "Datenschutz by Design, AV-Vertrag inklusive" },
  { k: "Hosting DE", v: "Rechenzentren in Frankfurt und Nürnberg" },
  { k: "24/7", v: "Monitoring mit Alarmierung bei jedem Fehler" },
  { k: "Festpreis", v: "Klarer Umfang pro Projektphase, keine Überraschungen" },
];

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div className={"marquee flex shrink-0 gap-3 pr-3" + (reverse ? " marquee-rev" : "")}>
        {[...items, ...items].map((t, i) => (
          <span
            key={i}
            className="whitespace-nowrap rounded-full border border-border px-5 py-2.5 text-sm text-foreground/80 sm:text-base"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Stack() {
  return (
    <section className="relative z-[3] bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-2xl text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            Wir sprechen fließend
            <span className="font-light italic text-foreground/60"> Ihre Software.</span>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Standard-Connectoren, wo es sie gibt. Eigene Schnittstellen, wo nicht. Auch für Altsysteme
            ohne API.
          </p>
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-3">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
      <div className="mx-auto mt-16 max-w-[1180px] px-5 sm:px-8">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map((f) => (
          <div key={f.k} className="bg-background p-6">
            <p className="text-2xl font-extrabold tracking-tight text-accent">{f.k}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.v}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
