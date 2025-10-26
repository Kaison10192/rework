export default function LanternIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="32" cy="12" r="6" />
        <rect x="18" y="18" width="28" height="32" rx="6" />
        <path d="M24 50h16" />
        <path d="M20 24h24" />
        <path d="M28 34c0-3 2-6 4-6s4 3 4 6-2 6-4 6-4-3-4-6z" fill="currentColor" />
      </g>
    </svg>
  );
}
