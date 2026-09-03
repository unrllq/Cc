import type {
  Article,
  City,
  Creator,
  EventItem,
  Mentor,
  Opportunity,
  Project,
  ProjectStatus,
  Specialization,
} from "./types";

export const CITIES: City[] = [
  { id: "berlin", name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { id: "amsterdam", name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { id: "paris", name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "warsaw", name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },
  { id: "vienna", name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { id: "copenhagen", name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { id: "milan", name: "Milan", country: "Italy", lat: 45.4642, lng: 9.19 },
  { id: "london", name: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276 },
];

export function cityOf(id: string): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

// ---------------------------------------------------------------------------
// CREATORS
// ---------------------------------------------------------------------------

interface CreatorSeed {
  name: string;
  cityId: string;
  specialization: Specialization;
  archetype: string;
  tags: string[];
  bio: string;
}

const CREATOR_SEEDS: CreatorSeed[] = [
  { name: "Mia Nova", cityId: "berlin", specialization: "Virtual Creator", archetype: "Digital It-Girl", tags: ["Fashion", "Culture", "Beauty"], bio: "A fully synthetic identity built at SYNTEZIS Berlin — fashion, culture and beauty told through a fictional lens with a very real audience." },
  { name: "Alex Rain", cityId: "amsterdam", specialization: "AI Filmmaker", archetype: "The Director", tags: ["Film", "Narrative", "AI Video"], bio: "Directs short-form AI films that blur the line between cinema and social content, produced entirely inside the SYNTEZIS pipeline." },
  { name: "Lena Void", cityId: "paris", specialization: "Digital Character Design", archetype: "The Sculptor", tags: ["Character", "3D", "Identity"], bio: "Designs digital personalities from the ground up — face, voice, wardrobe and backstory built as one coherent system." },
  { name: "Noah K", cityId: "warsaw", specialization: "3D / Synthetic Media", archetype: "The Technician", tags: ["3D", "Real-time", "Pipelines"], bio: "Builds the real-time 3D pipelines behind some of SYNTEZIS's most ambitious synthetic media formats." },
  { name: "Ines Solberg", cityId: "copenhagen", specialization: "AI Music", archetype: "The Composer", tags: ["Music", "Voice", "Sound"], bio: "Produces AI-assisted music and vocal identities for virtual artists across the SYNTEZIS network." },
  { name: "Théo Marchand", cityId: "paris", specialization: "Motion & VFX", archetype: "The Alchemist", tags: ["Motion", "VFX", "Editorial"], bio: "Turns still character designs into moving, breathing digital performers using motion capture and generative VFX." },
  { name: "Greta Lindqvist", cityId: "vienna", specialization: "Virtual Creator", archetype: "The Archivist", tags: ["Art", "History", "Culture"], bio: "A digital character rooted in Viennese art history, reinterpreted for a contemporary, cross-platform audience." },
  { name: "Marco Bellandi", cityId: "milan", specialization: "Fashion / Digital Editorial", archetype: "The Editor", tags: ["Fashion", "Editorial", "Luxury"], bio: "Produces synthetic fashion editorials for European luxury houses exploring digital-only campaigns." },
  { name: "Sofia Kowalska", cityId: "warsaw", specialization: "Digital Character Design", archetype: "The World-Builder", tags: ["Character", "Lore", "Design"], bio: "Builds entire fictional universes around her characters, treating each launch like a season of television." },
  { name: "Jonas Weber", cityId: "berlin", specialization: "AI Filmmaker", archetype: "The Documentarian", tags: ["Film", "Berlin", "Culture"], bio: "Documents Berlin's underground creative scenes through an AI-assisted documentary lens." },
  { name: "Elin Aasen", cityId: "copenhagen", specialization: "Voice & Sound Design", archetype: "The Voice", tags: ["Voice", "Sound", "Identity"], bio: "Designs the voice identity layer for a dozen SYNTEZIS characters, from cadence to accent to emotional range." },
  { name: "Priya Novak", cityId: "london", specialization: "Virtual Creator", archetype: "The Connector", tags: ["Lifestyle", "Community", "Brand"], bio: "London-based virtual creator focused on lifestyle content and cross-border brand partnerships." },
  { name: "Kasimir Orlov", cityId: "berlin", specialization: "3D / Synthetic Media", archetype: "The Engineer", tags: ["3D", "Tech", "R&D"], bio: "Leads experimental synthetic media R&D out of the Berlin studio floor, prototyping new production formats." },
  { name: "Nour Haddad", cityId: "amsterdam", specialization: "AI Music", archetype: "The Producer", tags: ["Music", "Production", "Sync"], bio: "AI music producer specialising in sync licensing for virtual artist catalogues." },
  { name: "Freya Holm", cityId: "copenhagen", specialization: "Fashion / Digital Editorial", archetype: "The Minimalist", tags: ["Fashion", "Scandi", "Editorial"], bio: "Scandinavian minimalism applied to digital fashion — clean lines, restrained palettes, maximum precision." },
  { name: "Dario Conti", cityId: "milan", specialization: "Motion & VFX", archetype: "The Performer", tags: ["Motion", "Performance", "VFX"], bio: "Former motion performer now directing full-body synthetic performance capture for SYNTEZIS characters." },
  { name: "Vera Lindgren", cityId: "vienna", specialization: "Digital Character Design", archetype: "The Philosopher", tags: ["Character", "Identity", "Ethics"], bio: "Explores the ethics and psychology of synthetic identity through the characters she designs." },
  { name: "Oskar Nowak", cityId: "warsaw", specialization: "AI Filmmaker", archetype: "The Editor", tags: ["Film", "Edit", "Format"], bio: "Specialises in short-format AI film built for vertical, sound-off, first-second-hook social consumption." },
  { name: "Camille Dubois", cityId: "paris", specialization: "Virtual Creator", archetype: "The Muse", tags: ["Art", "Fashion", "Editorial"], bio: "A digital muse for a new generation of Parisian art directors, moving between gallery and feed." },
  { name: "Leo Bergström", cityId: "berlin", specialization: "Voice & Sound Design", archetype: "The Sound Architect", tags: ["Sound", "Score", "Identity"], bio: "Composes the sonic identity — from notification chimes to full scores — for SYNTEZIS-produced formats." },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CREATORS: Creator[] = CREATOR_SEEDS.map((seed, i) => {
  const projectsCount = 6 + ((i * 7) % 18);
  const audience = 24_000 + ((i * 91_337) % 900_000);
  const brandCollabs = 4 + ((i * 3) % 42);
  const engagement = 3.2 + (((i * 13) % 65) / 10);
  const reach = audience * (6 + (i % 5));
  const memberSince = 2026 - (i % 2 === 0 ? 0 : 1);
  return {
    slug: slugify(seed.name),
    projectsCount,
    audience,
    brandCollabs,
    engagement: Math.round(engagement * 10) / 10,
    reach,
    memberSince,
    ...seed,
  };
});

// ---------------------------------------------------------------------------
// PROJECTS
// ---------------------------------------------------------------------------

const FORMATS = [
  "Digital Fashion Campaign",
  "AI Music Video",
  "Virtual Editorial",
  "Social Character Launch",
  "3D Campaign",
  "Brand Film",
  "Synthetic Documentary",
  "AR Activation",
];

const STATUSES: ProjectStatus[] = ["idea", "in-production", "live", "archived"];

const PROJECT_TITLES = [
  "Digital Spring", "Neon Atlas", "Ghost Frequency", "Second Skin", "Paper Moon",
  "Glass Season", "Echo Chamber II", "Synthetic Bloom", "Northern Static", "Marble Feed",
  "Velvet Signal", "Analog Ghost", "Silent Runway", "Chrome Garden", "Afterlight",
  "Wire Portrait", "Slow Motion City", "Liquid Type", "Nightframe", "Halo Drift",
  "Origin Story", "Studio Zero", "Bright Noise", "Falling Grid", "Interior Weather",
  "Loop Season", "Made of Light", "New Skin Vol.2", "The Long Take", "Reflex",
];

export const PROJECTS: Project[] = PROJECT_TITLES.map((title, i) => {
  const creator = CREATORS[i % CREATORS.length];
  const format = FORMATS[(i * 3) % FORMATS.length];
  const status = STATUSES[(i * 5) % STATUSES.length];
  const year = 2026 - (i % 2);
  const city = cityOf(creator.cityId);
  return {
    slug: slugify(`${creator.name}-${title}`),
    title,
    creatorSlug: creator.slug,
    format,
    year,
    status,
    summary: `${format} produced with ${creator.name} out of the SYNTEZIS ${city.name} studio floor.`,
    concept: `"${title}" began as a single character beat and grew into a full ${format.toLowerCase()} — built around ${creator.archetype.toLowerCase()} as a recurring visual motif, positioned for a European audience first.`,
    visualSystem: `A restrained palette pulled from the SYNTEZIS system — black, off-white and one controlled accent — applied across every frame, thumbnail and social cutdown to keep the identity consistent.`,
    production: `Produced across ${1 + (i % 3)} studio sessions using SYNTEZIS's AI image, video and 3D pipeline, with ${creator.name} directing performance and tone in every review pass.`,
    deliverables: [
      "Hero film (16:9 + 9:16)",
      "12 social cutdowns",
      "24 campaign stills",
      "Brand usage guidelines",
    ],
    team: [creator.name, "SYNTEZIS Production Lead", "AI Production Artist", "Motion Editor"],
  };
});

// ---------------------------------------------------------------------------
// EVENTS
// ---------------------------------------------------------------------------

interface EventSeed {
  name: string;
  cityId: string;
  type: EventItem["type"];
  date: string;
  description: string;
  seatsTotal: number;
  seatsTaken: number;
}

const EVENT_SEEDS: EventSeed[] = [
  { name: "Synthetic Media Night", cityId: "berlin", type: "Studio Night", date: "2026-03-12", description: "An open studio evening screening new synthetic media work from resident creators.", seatsTotal: 120, seatsTaken: 94 },
  { name: "AI Creator Meetup", cityId: "amsterdam", type: "Meetup", date: "2026-03-26", description: "Cross-border meetup for AI-native creators building in the Netherlands and beyond.", seatsTotal: 80, seatsTaken: 61 },
  { name: "Virtual Character Workshop", cityId: "berlin", type: "Workshop", date: "2026-04-09", description: "Hands-on workshop building a first digital character from brief to render.", seatsTotal: 30, seatsTaken: 27 },
  { name: "Synthetic Fashion Talk", cityId: "milan", type: "Talk", date: "2026-04-18", description: "A conversation on digital-only fashion campaigns with SYNTEZIS editorial leads.", seatsTotal: 60, seatsTaken: 22 },
  { name: "Open Call: Character Cohort 05", cityId: "berlin", type: "Open Call", date: "2026-04-30", description: "Applications open for the fifth resident creator cohort at the Berlin campus.", seatsTotal: 200, seatsTaken: 133 },
  { name: "AI Music Production Lab", cityId: "copenhagen", type: "Workshop", date: "2026-05-07", description: "Two-day intensive on AI-assisted music and voice production for virtual artists.", seatsTotal: 24, seatsTaken: 24 },
  { name: "Creator Meetup: Paris", cityId: "paris", type: "Meetup", date: "2026-05-14", description: "Monthly gathering for the Paris creator community and SYNTEZIS mentors.", seatsTotal: 70, seatsTaken: 38 },
  { name: "Studio Night: New Formats", cityId: "berlin", type: "Studio Night", date: "2026-05-28", description: "Screening experimental synthetic media formats currently in production.", seatsTotal: 100, seatsTaken: 45 },
  { name: "Brand x Creator Summit", cityId: "vienna", type: "Talk", date: "2026-06-04", description: "A day of talks connecting European brands with SYNTEZIS resident creators.", seatsTotal: 150, seatsTaken: 112 },
  { name: "3D Character Bootcamp", cityId: "warsaw", type: "Workshop", date: "2026-06-19", description: "Three-day intensive on real-time 3D character pipelines.", seatsTotal: 20, seatsTaken: 9 },
  { name: "Open Call: Studio Residencies", cityId: "berlin", type: "Open Call", date: "2026-07-02", description: "Applications open for six-month studio residencies at the Berlin campus.", seatsTotal: 200, seatsTaken: 58 },
  { name: "Creator Meetup: London", cityId: "london", type: "Meetup", date: "2026-07-16", description: "First London chapter meetup for the SYNTEZIS creator network.", seatsTotal: 90, seatsTaken: 31 },
];

export const EVENTS: EventItem[] = EVENT_SEEDS.map((e) => ({
  ...e,
  slug: slugify(`${e.name}-${e.cityId}`),
}));

// ---------------------------------------------------------------------------
// BRAND OPPORTUNITIES
// ---------------------------------------------------------------------------

interface OpportunitySeed {
  brand: string;
  campaign: string;
  budget: number;
  cityId: string | "Remote";
  category: string;
  deadline: string;
}

const OPPORTUNITY_SEEDS: OpportunitySeed[] = [
  { brand: "NORDLYS", campaign: "Fashion Campaign", budget: 4500, cityId: "berlin", category: "Fashion", deadline: "2026-03-20" },
  { brand: "CLEARSKIN LABS", campaign: "Beauty Content", budget: 2800, cityId: "Remote", category: "Beauty", deadline: "2026-03-25" },
  { brand: "AMPFIELD RECORDS", campaign: "Music Visual", budget: 3200, cityId: "Remote", category: "Music", deadline: "2026-04-01" },
  { brand: "MONO STUDIO", campaign: "Digital Editorial", budget: 5200, cityId: "paris", category: "Editorial", deadline: "2026-04-05" },
  { brand: "GRIDWEAR", campaign: "Sportswear Launch Film", budget: 6800, cityId: "amsterdam", category: "Sport", deadline: "2026-04-10" },
  { brand: "HALO COSMETICS", campaign: "Virtual Ambassador", budget: 9000, cityId: "Remote", category: "Beauty", deadline: "2026-04-14" },
  { brand: "SIGNAL WATCHES", campaign: "Product Film", budget: 4100, cityId: "vienna", category: "Product", deadline: "2026-04-18" },
  { brand: "PALETTE.CO", campaign: "Art Direction Series", budget: 3600, cityId: "milan", category: "Art", deadline: "2026-04-22" },
  { brand: "URBAN ATLAS", campaign: "City Documentary Shorts", budget: 5400, cityId: "warsaw", category: "Documentary", deadline: "2026-04-28" },
  { brand: "FLORA & CO", campaign: "Sustainable Fashion Capsule", budget: 4700, cityId: "copenhagen", category: "Fashion", deadline: "2026-05-02" },
  { brand: "OBSIDIAN GAMES", campaign: "Character Crossover", budget: 8200, cityId: "Remote", category: "Gaming", deadline: "2026-05-06" },
  { brand: "LUMEN AUDIO", campaign: "AI Voice Campaign", budget: 3900, cityId: "berlin", category: "Audio", deadline: "2026-05-11" },
  { brand: "VESSEL SKINCARE", campaign: "Ingredient Story Series", budget: 2600, cityId: "Remote", category: "Beauty", deadline: "2026-05-15" },
  { brand: "METROLINE", campaign: "Transit Brand Film", budget: 5000, cityId: "london", category: "Brand", deadline: "2026-05-20" },
  { brand: "ARKIVE JOURNAL", campaign: "Editorial Cover Series", budget: 3100, cityId: "paris", category: "Editorial", deadline: "2026-05-24" },
];

export const OPPORTUNITIES: Opportunity[] = OPPORTUNITY_SEEDS.map((o) => ({
  ...o,
  currency: "EUR",
  slug: slugify(`${o.brand}-${o.campaign}`),
  deliverables: ["1 hero film", "6 social cutdowns", "8 campaign stills", "Usage rights, 12 months"],
  requirements: ["Active SYNTEZIS creator profile", "Portfolio matching campaign category", "Availability within deadline window"],
}));

// ---------------------------------------------------------------------------
// ARTICLES / PRESS
// ---------------------------------------------------------------------------

export const ARTICLES: Article[] = [
  { slug: "rise-of-synthetic-personalities", category: "Research", title: "The Rise of Synthetic Personalities", excerpt: "How virtual characters moved from novelty to a recognised creative discipline across Europe.", date: "2026-01-14", author: "SYNTEZIS Journal", readMinutes: 6 },
  { slug: "berlin-europe-creator-capital", category: "News", title: "Why Berlin Could Become Europe's Creator Capital", excerpt: "Inside the infrastructure argument for building the next generation of digital talent in Berlin.", date: "2026-01-22", author: "SYNTEZIS Journal", readMinutes: 5 },
  { slug: "new-digital-talent", category: "Research", title: "The New Digital Talent", excerpt: "Digital influencers are becoming a professional creative category, not a technology demo.", date: "2026-02-02", author: "SYNTEZIS Journal", readMinutes: 7 },
  { slug: "interview-mia-nova", category: "Interviews", title: "Building a Character That Outlives a Single Post", excerpt: "A conversation with Mia Nova on designing identity for the long term.", date: "2026-02-10", author: "SYNTEZIS Journal", readMinutes: 8 },
  { slug: "inside-the-production-floor", category: "Creator Stories", title: "Inside the Production Floor", excerpt: "A day inside the Berlin studio with three resident creators mid-shoot.", date: "2026-02-18", author: "SYNTEZIS Journal", readMinutes: 4 },
  { slug: "cohort-04-open-call", category: "Events", title: "Cohort 04 Open Call Now Live", excerpt: "Applications are open for the fourth resident creator cohort at the Berlin campus.", date: "2026-02-24", author: "SYNTEZIS Journal", readMinutes: 2 },
  { slug: "ethics-of-synthetic-identity", category: "Research", title: "The Ethics of Synthetic Identity", excerpt: "Where SYNTEZIS draws the line between fiction, disclosure and audience trust.", date: "2026-03-01", author: "SYNTEZIS Journal", readMinutes: 9 },
  { slug: "interview-noah-k", category: "Interviews", title: "Real-Time 3D Is the New Camera", excerpt: "Noah K on why real-time engines are replacing traditional capture for character work.", date: "2026-03-08", author: "SYNTEZIS Journal", readMinutes: 6 },
  { slug: "brand-partnerships-report", category: "Research", title: "European Brand Partnerships, One Year In", excerpt: "A look at how brands are budgeting for virtual creator collaborations in 2026.", date: "2026-03-15", author: "SYNTEZIS Journal", readMinutes: 5 },
  { slug: "network-expands-eight-cities", category: "News", title: "The Network Expands to Eight Cities", excerpt: "SYNTEZIS creators are now active across Berlin, Amsterdam, Paris, Warsaw, Vienna, Copenhagen, Milan and London.", date: "2026-03-20", author: "SYNTEZIS Journal", readMinutes: 3 },
];

// ---------------------------------------------------------------------------
// MENTORS
// ---------------------------------------------------------------------------

export const MENTORS: Mentor[] = [
  { name: "Helena Brandt", role: "Creative Director", specialization: "Visual identity & art direction" },
  { name: "Yusuf Erdem", role: "AI Producer", specialization: "AI image, video & production systems" },
  { name: "Charlotte Meyer", role: "Brand Strategist", specialization: "Brand partnerships & licensing" },
  { name: "Milo Andersen", role: "Growth Mentor", specialization: "Audience & platform growth" },
  { name: "Ren Kobayashi-Lund", role: "Technical Director", specialization: "3D pipelines & real-time systems" },
  { name: "Ada Falk", role: "Executive Producer", specialization: "Production management" },
  { name: "Bram Jansen", role: "Community Lead", specialization: "Creator community & events" },
  { name: "Simone Rey", role: "Partnerships Director", specialization: "European brand relations" },
];

// ---------------------------------------------------------------------------
// LOOKUPS
// ---------------------------------------------------------------------------

export function getCreator(slug: string): Creator | undefined {
  return CREATORS.find((c) => c.slug === slug);
}

export function projectsByCreator(slug: string): Project[] {
  return PROJECTS.filter((p) => p.creatorSlug === slug);
}

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getEvent(slug: string): EventItem | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

export function getOpportunity(slug: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.slug === slug);
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
