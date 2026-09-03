"use client";

import { Calendar, MapPin, Check } from "lucide-react";
import type { EventItem } from "@/lib/types";
import { cityOf } from "@/lib/data";
import { useLocalSet } from "@/lib/use-local-set";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function EventCard({ event }: { event: EventItem }) {
  const { has, add, hydrated } = useLocalSet("syntezis:reserved-events");
  const { push } = useToast();
  const reserved = hydrated && has(event.slug);
  const city = cityOf(event.cityId);
  const seatsLeft = Math.max(0, event.seatsTotal - event.seatsTaken - (reserved ? 1 : 0));
  const full = seatsLeft <= 0 && !reserved;

  return (
    <div className="flex flex-col justify-between gap-6 rounded-3xl border border-ink/10 bg-paper p-6 transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="label-mono rounded-full bg-ink/5 px-3 py-1 text-ink/60">{event.type}</span>
          <span className="label-mono text-ink/40">
            {seatsLeft} SEAT{seatsLeft === 1 ? "" : "S"} LEFT
          </span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight">{event.name}</h3>
        <p className="text-sm leading-relaxed text-ink/60">{event.description}</p>
        <div className="flex flex-col gap-2 text-sm text-ink/60">
          <span className="flex items-center gap-2">
            <Calendar size={15} />{" "}
            {new Date(event.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={15} /> {city.name}, {city.country}
          </span>
        </div>
      </div>
      <button
        type="button"
        disabled={full}
        onClick={() => {
          add(event.slug);
          push({ title: "Spot reserved ✓", description: event.name });
        }}
        className={cn(
          "label-mono flex w-full items-center justify-center gap-2 rounded-full py-3.5 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
          reserved ? "bg-lime text-ink" : "bg-ink text-off-white hover:bg-dark"
        )}
      >
        {reserved ? (
          <>
            <Check size={14} /> Spot Reserved
          </>
        ) : full ? (
          "Fully Booked"
        ) : (
          "Reserve Spot →"
        )}
      </button>
    </div>
  );
}
