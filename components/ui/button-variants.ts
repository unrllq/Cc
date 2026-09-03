import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-semibold tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-off-white active:scale-[0.97] cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-ink text-off-white hover:bg-dark",
        lime: "bg-lime text-ink hover:brightness-95",
        outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-off-white",
        ghost: "text-ink hover:bg-ink/5",
        signal: "bg-signal text-off-white hover:brightness-105",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-14 px-8 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
