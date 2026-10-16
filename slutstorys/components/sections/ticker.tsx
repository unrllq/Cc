import { VelocityScroll } from "@/components/ui/scroll-based-velocity";

const Star = () => <span className="mx-[0.35em] inline-block translate-y-[-0.08em] text-[0.7em]">✶</span>;

export function Ticker({ tilt = -2.5 }: { tilt?: number }) {
  return (
    <div className="relative z-10 -my-2 overflow-hidden py-10">
      <div style={{ transform: `rotate(${tilt}deg)` }} className="-mx-8">
        <VelocityScroll
          default_velocity={2.2}
          className="font-display text-[11vw] uppercase leading-[1.05] md:text-[7.5vw]"
          rowClassName={["bg-pink text-ink py-1", "stroke-text py-1"]}
          text={
            <>
              Дерзко<Star />Честно<Star />Вирусно<Star />
            </>
          }
          secondText={
            <>
              Stories that sell<Star />Stories that stick<Star />
            </>
          }
        />
      </div>
    </div>
  );
}
