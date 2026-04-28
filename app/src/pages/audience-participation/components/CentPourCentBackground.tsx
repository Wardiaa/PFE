// CentPourCentBackground.tsx
// Optional decorative wordmark component you can drop into the audience page
// header or the "waiting" screen. Renders the giant glowing "100%" exactly
// like the show's stage logo.

interface Props {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
}

const SIZES = {
  sm: "text-5xl",
  md: "text-7xl sm:text-8xl",
  lg: "text-8xl sm:text-9xl md:text-[10rem]",
};

export function CentPourCentBackground({ size = "md", subtitle }: Props) {
  return (
    <div className="text-center select-none">
      <div
        className={`cpl-wordmark leading-none ${SIZES[size]}`}
        aria-hidden="true"
      >
        100<span style={{ color: "white" }}>%</span>
      </div>
      <div className="mt-2 cpl-display text-base sm:text-lg tracking-[0.4em] uppercase text-white/85">
        Logique
      </div>
      {subtitle && (
        <p className="mt-3 text-sm text-[color:var(--cpl-text-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
