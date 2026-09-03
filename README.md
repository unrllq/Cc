# SYNTEZIS INCUBATOR

European incubator for digital influencers & synthetic media — Berlin.

A fully functional demo site built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · framer-motion**, following a shadcn-style `components/ui` structure.

## Stack

- **Next.js 16** (App Router, React 19)
- **TypeScript**, strict mode
- **Tailwind CSS v4** (`@theme` design tokens in `app/globals.css`)
- **framer-motion** for scroll reveals, the hero mechanic and micro-interactions
- **class-variance-authority** + `cn()` (clsx + tailwind-merge) for shadcn-style variant components
- No backend — all "live" data lives in `lib/data.ts` and interactive state (applications, reservations, saved creators, membership, content calendar) is persisted to `localStorage`

## Structure

```
app/                    Routes (home, program, studio, creators, community,
                         apply, membership, brands, about, contact, journal,
                         workspace, legal)
components/ui/          shadcn-style primitives (button, dialog, sheet, tabs,
                         accordion, field, toast…) + the scroll-morph hero
components/site/        Page-level sections and composed components
lib/data.ts             Demo dataset: 8 cities, 20 creators, 30 projects,
                         12 events, 15 brand opportunities, 10 articles, 8 mentors
lib/avatar.ts           Procedural SVG "synthetic portrait" generator
                         (no stock photography — every portrait is generated)
```

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```
