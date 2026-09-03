import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
      <span className="label-mono text-ink/40">404 / NOT FOUND</span>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-7xl">Signal lost.</h1>
      <p className="mt-6 max-w-md text-ink/60">
        This page doesn&rsquo;t exist in the SYNTEZIS network. It may have moved, or the character was never produced.
      </p>
      <Link href="/" className={buttonVariants({ variant: "primary", size: "lg", className: "mt-10" })}>
        Back to home
      </Link>
    </section>
  );
}
