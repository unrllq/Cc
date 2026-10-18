import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Metrics } from "@/components/sections/metrics";
import { Nav } from "@/components/sections/nav";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";
import { Stack } from "@/components/sections/stack";
import { Studio } from "@/components/sections/studio";
import { Work } from "@/components/sections/work";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Metrics />
        <Services />
        <Process />
        <Work />
        <Stack />
        <Studio />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
