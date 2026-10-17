import InkOrbitFeatures from "@/components/ui/ink-orbit-features";

export function Services() {
  return (
    <section id="leistungen" className="relative z-[3] bg-background pt-24 sm:pt-32">
      <InkOrbitFeatures
        theme="dark"
        brand="SQOD"
        tag="Leistungen"
        title={"Ein System.\n*Statt zwanzig Insellösungen.*"}
        collaboration={{
          title: "Prozess-Automation",
          description:
            "Wiederkehrende Abläufe zwischen Abteilungen laufen automatisch – nachvollziehbar, protokolliert, ohne Copy-Paste.",
        }}
        reports={{
          title: "Automatisches Reporting",
          description:
            "Kennzahlen aus ERP, Shop und Buchhaltung landen täglich als fertiger Bericht im Postfach.",
        }}
        integrations={{
          title: "Schnittstellen & APIs",
          description:
            "Wir verbinden ERP, CRM, Shop, DATEV und Ihre Fachsoftware – per API, Middleware oder Eigenentwicklung.",
          tools: ["SAP", "DATEV", "HubSpot", "Shopify"],
        }}
        insights={{
          title: "Daten & Prognosen",
          description:
            "Saubere Stammdaten als Basis: Dashboards und Prognosen, auf die sich Entscheidungen verlassen können.",
        }}
        style={{ background: "var(--color-background)" }}
      />
    </section>
  );
}
