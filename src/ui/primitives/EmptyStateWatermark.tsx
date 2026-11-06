export function EmptyStateWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      data-empty-state-watermark="true"
      className={`pointer-events-none absolute inset-0 h-full w-full text-[#18181B] ${className}`}
      style={{
        opacity: 0.04,
        WebkitMaskImage: "radial-gradient(ellipse at center, black 50%, transparent 100%)",
        maskImage: "radial-gradient(ellipse at center, black 50%, transparent 100%)",
      }}
    >
      <rect width="100%" height="100%" fill="url(#pattern-tnalak-circuit)" />
    </svg>
  );
}
