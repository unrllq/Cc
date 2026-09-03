export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export type Specialization =
  | "Virtual Creator"
  | "AI Filmmaker"
  | "Digital Character Design"
  | "3D / Synthetic Media"
  | "AI Music"
  | "Fashion / Digital Editorial"
  | "Motion & VFX"
  | "Voice & Sound Design";

export interface Creator {
  slug: string;
  name: string;
  cityId: string;
  specialization: Specialization;
  archetype: string;
  tags: string[];
  bio: string;
  projectsCount: number;
  audience: number;
  brandCollabs: number;
  memberSince: number;
  engagement: number; // percent
  reach: number;
}

export type ProjectStatus = "idea" | "in-production" | "live" | "archived";

export interface Project {
  slug: string;
  title: string;
  creatorSlug: string;
  format: string;
  year: number;
  status: ProjectStatus;
  summary: string;
  concept: string;
  visualSystem: string;
  production: string;
  deliverables: string[];
  team: string[];
}

export interface EventItem {
  slug: string;
  name: string;
  date: string;
  cityId: string;
  type: "Meetup" | "Workshop" | "Studio Night" | "Open Call" | "Talk";
  seatsTotal: number;
  seatsTaken: number;
  description: string;
}

export interface Opportunity {
  slug: string;
  brand: string;
  campaign: string;
  budget: number;
  currency: string;
  cityId: string | "Remote";
  deadline: string;
  deliverables: string[];
  requirements: string[];
  category: string;
}

export interface Article {
  slug: string;
  category: "News" | "Interviews" | "Creator Stories" | "Research" | "Events";
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readMinutes: number;
}

export interface Mentor {
  name: string;
  role: string;
  specialization: string;
}
