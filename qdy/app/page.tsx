import { PixelLiquidBg } from "@/components/ui/pixel-liquid-bg";
import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { ServiceTicker, ClientTicker } from "@/components/sections/tickers";
import { Services } from "@/components/sections/services";
import { Cases } from "@/components/sections/cases";
import { Process, Contact, Footer } from "@/components/sections/process-cta";

export default function Home() {
  return (
    <>
      {/* Fixed liquid pixel background — everything floats above it */}
      <div className="fixed inset-0 -z-10">
        <PixelLiquidBg
          colors={["#07060d", "#1b0d45", "#6d3cff", "#c8ff3d"]}
          pixelSize={9}
          speed={0.55}
          turbulence={3.4}
          mouseInfluence={0.7}
        />
        {/* vignette keeps text readable over the bright liquid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,6,13,0.25),rgba(7,6,13,0.85))]" />
      </div>

      <Nav />
      <main>
        <Hero />
        <ServiceTicker />
        <Services />
        <ClientTicker />
        <Cases />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
