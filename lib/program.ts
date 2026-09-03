export interface ProgramStage {
  n: string;
  key: string;
  title: string;
  summary: string;
  items: string[];
}

export const PROGRAM_STAGES: ProgramStage[] = [
  {
    n: "01",
    key: "discover",
    title: "Discover",
    summary: "We stress-test the idea before a single frame gets produced.",
    items: ["Idea development", "Market research", "Character identity", "Audience positioning"],
  },
  {
    n: "02",
    key: "build",
    title: "Build",
    summary: "Visual identity and production systems come together on the studio floor.",
    items: ["Visual identity", "AI production", "Content system", "Social identity"],
  },
  {
    n: "03",
    key: "launch",
    title: "Launch",
    summary: "First content ships, channels go live, and community starts to form.",
    items: ["First content", "Social channels", "Community", "Growth"],
  },
  {
    n: "04",
    key: "scale",
    title: "Scale",
    summary: "From a working format to a sustainable, licensable business.",
    items: ["Brand partnerships", "Monetization", "Licensing", "International expansion"],
  },
];
