type XRLogoProps = {
  size?: number
  glow?: boolean
  className?: string
}

export function XRLogo({ size = 64, glow = true, className = '' }: XRLogoProps) {
  return (
    <svg
      viewBox="0 0 220 120"
      width={size}
      height={(size * 120) / 220}
      className={className}
      role="img"
      aria-label="XR Station logo"
    >
      <defs>
        <filter id="xr-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        fill="none"
        stroke="#c9a84c"
        strokeWidth="8"
        strokeLinecap="square"
        strokeLinejoin="miter"
        filter={glow ? 'url(#xr-glow)' : undefined}
      >
        <path d="M18 18 L76 18 L50 56 L86 102" />
        <path d="M46 102 L82 56" />
        <path d="M80 18 L116 18 L138 48 L176 48 L176 18 L202 18 L202 102 L176 102 L176 72 L138 72 L116 102 L82 102" />
        <path d="M98 18 L154 102" />
      </g>
    </svg>
  )
}
