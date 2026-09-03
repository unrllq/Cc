"use client";

import { useEffect, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type ContentType = "Reel" | "Image" | "Story" | "Campaign" | "Brand Post";

interface CalendarItem {
  id: string;
  title: string;
  type: ContentType;
}

const TYPE_COLOR: Record<ContentType, string> = {
  Reel: "bg-lime/40",
  Image: "bg-sky/40",
  Story: "bg-signal/20",
  Campaign: "bg-ink/10",
  "Brand Post": "bg-light-gray",
};

const DEFAULT_STATE: Record<string, CalendarItem[]> = {
  Mon: [{ id: "m1", title: "Studio BTS", type: "Story" }],
  Tue: [{ id: "t1", title: "Character Reel v2", type: "Reel" }],
  Wed: [],
  Thu: [{ id: "th1", title: "Brand teaser", type: "Brand Post" }],
  Fri: [{ id: "f1", title: "Editorial drop", type: "Image" }],
  Sat: [],
  Sun: [{ id: "s1", title: "Weekly campaign wrap", type: "Campaign" }],
};

const STORAGE_KEY = "syntezis:content-calendar";

export function ContentCalendar() {
  const [board, setBoard] = useState<Record<string, CalendarItem[]>>(DEFAULT_STATE);
  const [dragging, setDragging] = useState<{ day: string; id: string } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setBoard(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = (next: Record<string, CalendarItem[]>) => {
    setBoard(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const moveItem = (fromDay: string, id: string, toDay: string) => {
    if (fromDay === toDay) return;
    const item = board[fromDay]?.find((i) => i.id === id);
    if (!item) return;
    const next = {
      ...board,
      [fromDay]: board[fromDay].filter((i) => i.id !== id),
      [toDay]: [...(board[toDay] ?? []), item],
    };
    persist(next);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {DAYS.map((day) => (
        <div
          key={day}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => dragging && moveItem(dragging.day, dragging.id, day)}
          className="flex min-h-[180px] flex-col gap-2 rounded-2xl border border-ink/10 bg-paper p-3"
        >
          <span className="label-mono text-ink/40">{day.toUpperCase()}</span>
          <div className="flex flex-1 flex-col gap-2">
            {(board[day] ?? []).map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragging({ day, id: item.id })}
                onDragEnd={() => setDragging(null)}
                className={`cursor-grab rounded-xl px-3 py-2.5 text-xs font-semibold leading-snug ${TYPE_COLOR[item.type]} active:cursor-grabbing`}
              >
                <p className="label-mono mb-1 text-[9px] text-ink/50">{item.type}</p>
                {item.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
