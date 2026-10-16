import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { Ticker } from "@/components/sections/ticker";
import { Manifesto } from "@/components/sections/manifesto";
import { Services } from "@/components/sections/services";
import { Cases } from "@/components/sections/cases";
import { Process } from "@/components/sections/process";
import { Voices } from "@/components/sections/voices";
import { Contact, Footer } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      {/* global film grain */}
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[60] opacity-[0.07] mix-blend-overlay" />
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <Manifesto />
        <Services />
        <Ticker tilt={2} />
        <Cases />
        <Process />
        <Voices />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
