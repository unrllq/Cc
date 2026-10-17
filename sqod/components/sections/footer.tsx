"use client";

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";

export function Footer() {
  return (
    <div className="relative z-[3] w-full">
      <HalftoneWordmarkFooter
        wordmark="sqod"
        label="SQOD — Studio für Systemintegration"
        meta="©2026 · Berlin · Made in Germany"
        backToTopLabel="Nach oben ↑"
        palette={{ background: "#0c0c0b", ink: "#ece6da", warm: "#ff5a1f" }}
        height="600px"
        columns={[
          {
            title: "Leistungen",
            links: [
              { label: "Schnittstellen & APIs", href: "#leistungen" },
              { label: "Prozess-Automation", href: "#leistungen" },
              { label: "Reporting & BI", href: "#leistungen" },
            ],
          },
          {
            title: "Studio",
            links: [
              { label: "Projekte", href: "#projekte" },
              { label: "Ablauf", href: "#ablauf" },
              { label: "Kontakt", href: "#kontakt" },
            ],
          },
          {
            title: "Rechtliches",
            links: [
              { label: "hallo@sqod.de", href: "mailto:hallo@sqod.de" },
              { label: "Impressum", href: "#" },
              { label: "Datenschutz", href: "#" },
            ],
          },
        ]}
      />
    </div>
  );
}
