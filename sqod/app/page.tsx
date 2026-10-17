import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { GalleryTimeline } from "@/components/sections/gallery-timeline";
import { Services } from "@/components/sections/services";
import { Stack } from "@/components/sections/stack";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";

export default function Page() {
  return (
    <main>
      <Nav />
      <Hero />
      <GalleryTimeline />
      <Services />
      <Stack />
      <Contact />
      <Footer />
    </main>
  );
}
