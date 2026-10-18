// Shared content for the Junkies site. Contact data are placeholders.
export const CONTACT = {
  email: "hallo@junkies.dev",
  phone: "+49 40 000 000 00",
  phoneHref: "+4940000000000",
  street: "Musterstraße 1",
  city: "20457 Hamburg",
};

export type Cap = "rose" | "blue" | "green" | "amber";

export const CAP_HEX: Record<Cap, { cap: string; led: string }> = {
  rose: { cap: "#fecdd3", led: "#fb7185" },
  blue: { cap: "#bfdbfe", led: "#60a5fa" },
  green: { cap: "#bbf7d0", led: "#4ade80" },
  amber: { cap: "#fde68a", led: "#fbbf24" },
};
